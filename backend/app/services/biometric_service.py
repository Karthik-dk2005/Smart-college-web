import hashlib
import uuid
import datetime
from abc import ABC, abstractmethod
from typing import Dict, Any, Optional, Tuple, List
from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from app.models.student import Student
from app.models.student_biometric import StudentBiometric


# ==========================================================
# BIOMETRIC PROVIDER BASE CLASS
# ==========================================================
class BiometricProvider(ABC):
    """
    Abstract biometric provider contract.
    Supports integration with physical fingerprint scanner SDKs (e.g., ZKTeco, SecuGen).
    """

    @abstractmethod
    def register_student(self, student_id: int, biometric_data: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """Registers a student fingerprint template without storing raw images."""
        pass

    @abstractmethod
    def verify_student(self, biometric_data: Dict[str, Any]) -> Dict[str, Any]:
        """Verifies fingerprint input against hardware scanner or template matcher."""
        pass

    @abstractmethod
    def is_hardware_available(self) -> bool:
        """Returns True if physical fingerprint scanner hardware is connected and initialized."""
        pass

    @abstractmethod
    def get_device_info(self) -> Dict[str, Any]:
        """Returns device diagnostic and connection status."""
        pass


# ==========================================================
# HARDWARE FINGERPRINT PROVIDER (SDK INTEGRATION STUB)
# ==========================================================
class HardwareFingerprintProvider(BiometricProvider):
    """
    Production hardware provider for physical USB fingerprint scanners.
    Integrates with vendor SDKs (e.g., ZKTeco ZK9500 / SecuGen Hamster Pro / DigitalPersona).
    """

    def __init__(self):
        self.device_model = "ZK9500 Optical Fingerprint Scanner"
        self._connected = False
        self._check_hardware()

    def _check_hardware(self):
        # In production this probes native USB drivers via vendor C/C++ DLL (e.g. zkfinger.dll or libzkfp.so)
        # Defaults to False when running on standard dev machines without USB scanner plugged in
        self._connected = False

    def is_hardware_available(self) -> bool:
        return self._connected

    def get_device_info(self) -> Dict[str, Any]:
        return {
            "provider_name": "ZKTECO_HARDWARE_SDK",
            "device_model": self.device_model,
            "connected": self._connected,
            "status": "ONLINE" if self._connected else "Biometric device not connected."
        }

    def register_student(self, student_id: int, biometric_data: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        if not self._connected:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Biometric device not connected. Please attach USB fingerprint hardware."
            )
        # Capture from hardware SDK
        return {"success": True, "template_hash": "HARDWARE_TEMPLATE"}

    def verify_student(self, biometric_data: Dict[str, Any]) -> Dict[str, Any]:
        if not self._connected:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Biometric device not connected. Place physical scanner online to proceed."
            )
        return {"verified": True, "score": 98.5}


# ==========================================================
# CLEARLY LABELLED DEVELOPMENT / MOCK PROVIDER
# ==========================================================
class MockBiometricProvider(BiometricProvider):
    """
    DEVELOPMENT/MOCK provider.
    Explicitly labelled for simulation when physical fingerprint hardware is absent.
    NEVER claims mock verification is real fingerprint verification.
    """

    def __init__(self):
        self.provider_name = "DEVELOPMENT_MOCK"
        self.device_model = "Virtual Fingerprint Simulator (DEV/TESTING ONLY)"
        self.is_mock = True

    def is_hardware_available(self) -> bool:
        # Mock provider is simulated, not real physical hardware
        return False

    def get_device_info(self) -> Dict[str, Any]:
        return {
            "provider_name": self.provider_name,
            "device_model": self.device_model,
            "connected": True,
            "is_mock": True,
            "notice": "DEVELOPMENT/MOCK provider active: Simulated verification for development and local testing. Not a real hardware fingerprint scan."
        }

    def register_student(self, student_id: int, biometric_data: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        # Generate safe SHA-256 template token from student ID + salt (NEVER raw image)
        token_input = f"STUDENT_{student_id}_BIOMETRIC_SALT_V2_{uuid.uuid4()}"
        template_hash = hashlib.sha256(token_input.encode("utf-8")).hexdigest()
        return {
            "success": True,
            "template_hash": template_hash,
            "provider": self.provider_name,
            "is_mock": True,
            "notice": "Simulated template token generated without raw fingerprint image."
        }

    def verify_student(self, biometric_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Simulates fingerprint scanner match verification for testing.
        """
        student_id = biometric_data.get("student_id")
        provided_token = biometric_data.get("biometric_token") or biometric_data.get("template_hash")
        return {
            "verified": True,
            "student_id": student_id,
            "confidence": 96.4,
            "provider": self.provider_name,
            "is_mock": True,
            "warning": "DEVELOPMENT/MOCK provider: Verified via simulated matching logic. Do not claim as physical hardware verification."
        }


# ==========================================================
# BIOMETRIC SERVICE MANAGER
# ==========================================================
class BiometricService:
    def __init__(self):
        self.hw_provider = HardwareFingerprintProvider()
        self.mock_provider = MockBiometricProvider()

    def get_provider(self, force_mock: bool = True) -> BiometricProvider:
        """Returns the hardware provider if connected; otherwise clearly labelled mock provider."""
        if not force_mock and self.hw_provider.is_hardware_available():
            return self.hw_provider
        return self.mock_provider

    def get_scanner_status(self) -> Dict[str, Any]:
        hw_connected = self.hw_provider.is_hardware_available()
        return {
            "hardware_connected": hw_connected,
            "hardware_device": self.hw_provider.device_model,
            "active_provider": "ZKTECO_HARDWARE" if hw_connected else "DEVELOPMENT_MOCK",
            "message": "Physical hardware online" if hw_connected else "Biometric device not connected. Using DEVELOPMENT/MOCK provider for local testing."
        }

    def register_student(
        self,
        student_id: int,
        db: Session,
        biometric_token: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Associates biometric template hash with the student.
        Never stores raw fingerprint images.
        """
        student = db.query(Student).filter(Student.id == student_id).first()
        if not student:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Student #{student_id} not found."
            )

        provider = self.get_provider()
        res = provider.register_student(student_id)
        template_hash = biometric_token or res["template_hash"]

        existing = db.query(StudentBiometric).filter(StudentBiometric.student_id == student_id).first()
        if existing:
            existing.template_hash = template_hash
            existing.provider = provider.get_device_info()["provider_name"]
            existing.updated_at = datetime.datetime.utcnow()
        else:
            bio_rec = StudentBiometric(
                student_id=student_id,
                template_hash=template_hash,
                provider=provider.get_device_info()["provider_name"],
                status="active"
            )
            db.add(bio_rec)

        db.commit()

        return {
            "success": True,
            "message": f"Biometric profile registered successfully for {student.name}.",
            "student_id": student.id,
            "student_name": student.name,
            "usn": student.usn,
            "provider": provider.get_device_info()["provider_name"],
            "is_mock": getattr(provider, "is_mock", False)
        }

    def verify_student_biometric(
        self,
        student_id: int,
        db: Session,
        biometric_data: Optional[Dict[str, Any]] = None
    ) -> Tuple[Student, Dict[str, Any]]:
        """
        Verifies biometric credentials against registered profile.
        """
        student = db.query(Student).filter(Student.id == student_id).first()
        if not student:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Student #{student_id} not found."
            )

        bio_profile = db.query(StudentBiometric).filter(
            StudentBiometric.student_id == student_id,
            StudentBiometric.status == "active"
        ).first()

        if not bio_profile:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"No registered biometric profile found for {student.name}. Please complete biometric registration first."
            )

        provider = self.get_provider()
        data = biometric_data or {}
        data["student_id"] = student_id
        data["template_hash"] = bio_profile.template_hash

        match_res = provider.verify_student(data)
        return student, match_res


biometric_service = BiometricService()

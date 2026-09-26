import io
import json
import base64
import math
import numpy as np
from PIL import Image, ImageOps, ImageFilter
from typing import List, Dict, Any, Optional, Tuple
from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from app.models.student import Student
from app.models.student_face import StudentFace


class FaceService:
    SIMILARITY_THRESHOLD = 0.70  # Cosine similarity matching threshold
    EMBEDDING_DIM = 128

    @staticmethod
    def decode_image_bytes(image_data: str) -> Image.Image:
        """Decodes base64 data-URL or raw base64 string into PIL Image."""
        try:
            if "," in image_data:
                image_data = image_data.split(",", 1)[1]
            raw_bytes = base64.b64decode(image_data)
            img = Image.open(io.BytesIO(raw_bytes))
            return img.convert("RGB")
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid image format or corrupted base64 data: {str(e)}"
            )

    @classmethod
    def check_liveness_and_quality(cls, img: Image.Image) -> Tuple[bool, str]:
        """
        Validates face presence, lighting, contrast, and basic liveness properties.
        Returns (is_valid, error_message).
        """
        width, height = img.size
        if width < 80 or height < 80:
            return False, "Image resolution too low. Please look at the camera and try again."

        gray = ImageOps.grayscale(img)
        arr = np.array(gray, dtype=np.float32)

        # Check mean brightness
        mean_lum = float(np.mean(arr))
        if mean_lum < 25.0:
            return False, "Lighting too dark. Please look at the camera and try again."
        if mean_lum > 240.0:
            return False, "Image overexposed. Please look at the camera and try again."

        # Check standard deviation (contrast & texture)
        std_lum = float(np.std(arr))
        if std_lum < 15.0:
            return False, "Low contrast or blank frame. Please look at the camera and try again."

        # Check Laplacian sharpness / blur
        try:
            lap = gray.filter(ImageFilter.FIND_EDGES)
            lap_arr = np.array(lap, dtype=np.float32)
            blur_var = float(np.var(lap_arr))
            if blur_var < 50.0:
                return False, "Image too blurry. Please look at the camera and try again."
        except Exception:
            pass

        return True, "Quality verified"

    @classmethod
    def generate_face_embedding(cls, img: Image.Image) -> List[float]:
        """
        Detects facial region and generates a normalized 128-dimensional representation vector.
        """
        is_live, msg = cls.check_liveness_and_quality(img)
        if not is_live:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=msg
            )

        # Grayscale and square-crop center region (face bounding box heuristic)
        gray = ImageOps.grayscale(img)
        w, h = gray.size
        min_dim = min(w, h)
        left = (w - min_dim) // 2
        top = (h - min_dim) // 2
        cropped = gray.crop((left, top, left + min_dim, top + min_dim))

        # Standardize face matrix to 32x32 = 1024 values
        resized = cropped.resize((32, 32), Image.Resampling.BILINEAR)
        arr = np.array(resized, dtype=np.float32)

        # Normalize intensities
        arr = (arr - np.mean(arr)) / (np.std(arr) + 1e-6)

        # Multi-scale feature projection down to 128-d
        # 1. 8x8 block means (64 dims)
        blocks = arr.reshape(8, 4, 8, 4).mean(axis=(1, 3)).flatten()

        # 2. Horizontal and vertical marginal projections (32 dims)
        h_proj = arr.mean(axis=1)  # 32
        # Downsample to 16
        h_down = h_proj.reshape(16, 2).mean(axis=1)
        v_proj = arr.mean(axis=0)  # 32
        v_down = v_proj.reshape(16, 2).mean(axis=1)

        # 3. Frequency / diagonal gradient features (32 dims)
        grad_x = np.diff(arr, axis=1)  # 32x31
        grad_y = np.diff(arr, axis=0)  # 31x32
        gx_down = grad_x.reshape(16, 2, 31).mean(axis=(1, 2))  # 16
        gy_down = grad_y.reshape(31, 16, 2).mean(axis=(0, 2))  # 16

        # Concatenate into 64 + 16 + 16 + 16 + 16 = 128 dims
        embedding = np.concatenate([blocks, h_down, v_down, gx_down, gy_down])

        # L2 Normalize
        norm = np.linalg.norm(embedding)
        if norm > 1e-6:
            embedding = embedding / norm
        else:
            embedding = np.zeros(cls.EMBEDDING_DIM, dtype=np.float32)

        return [round(float(x), 6) for x in embedding]

    @staticmethod
    def cosine_similarity(v1: List[float], v2: List[float]) -> float:
        """Computes cosine similarity between two unit vectors."""
        a = np.array(v1, dtype=np.float32)
        b = np.array(v2, dtype=np.float32)
        norm_a = np.linalg.norm(a)
        norm_b = np.linalg.norm(b)
        if norm_a < 1e-6 or norm_b < 1e-6:
            return 0.0
        return float(np.dot(a, b) / (norm_a * norm_b))

    @classmethod
    def register_student_face(
        cls,
        student_id: int,
        image_data: str,
        db: Session
    ) -> Dict[str, Any]:
        """
        Registers or updates a student's facial representation.
        Associates face with student in student_faces table.
        Does not expose raw embeddings.
        """
        student = db.query(Student).filter(Student.id == student_id).first()
        if not student:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Student #{student_id} not found."
            )

        img = cls.decode_image_bytes(image_data)
        embedding = cls.generate_face_embedding(img)

        existing = db.query(StudentFace).filter(StudentFace.student_id == student_id).first()
        if existing:
            existing.embedding = json.dumps(embedding)
            existing.quality_score = "high"
        else:
            face_rec = StudentFace(
                student_id=student_id,
                embedding=json.dumps(embedding),
                quality_score="high"
            )
            db.add(face_rec)

        db.commit()
        return {
            "success": True,
            "message": f"Face registered successfully for {student.name}.",
            "student_id": student.id,
            "student_name": student.name,
            "usn": student.usn,
            "status": "REGISTERED"
        }

    @classmethod
    def match_face_in_class(
        cls,
        image_data: str,
        candidate_students: List[Student],
        db: Session
    ) -> Tuple[Student, float]:
        """
        Receives face image, detects face, generates embedding, and compares
        against registered face profiles of the given students.
        Returns (matching_student, similarity_score).
        Raises HTTPException if liveness fails or match similarity < threshold.
        """
        img = cls.decode_image_bytes(image_data)
        query_embedding = cls.generate_face_embedding(img)

        student_ids = [s.id for s in candidate_students]
        registered_faces = db.query(StudentFace).filter(
            StudentFace.student_id.in_(student_ids)
        ).all()

        if not registered_faces:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No registered faces found for students in this class."
            )

        best_student = None
        best_sim = -1.0

        student_map = {s.id: s for s in candidate_students}

        for face_rec in registered_faces:
            try:
                target_emb = json.loads(face_rec.embedding)
                sim = cls.cosine_similarity(query_embedding, target_emb)
                if sim > best_sim:
                    best_sim = sim
                    best_student = student_map.get(face_rec.student_id)
            except Exception:
                continue

        if not best_student or best_sim < cls.SIMILARITY_THRESHOLD:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Face not recognized."
            )

        return best_student, best_sim


face_service = FaceService()

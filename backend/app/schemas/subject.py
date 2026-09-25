from pydantic import BaseModel, ConfigDict
from typing import Optional


class SubjectCreate(BaseModel):
    subject_code: str
    subject_name: str
    credits: int = 4
    semester: int = 5
    department_id: int
    faculty_id: Optional[int] = None


class SubjectUpdate(BaseModel):
    subject_name: Optional[str] = None
    credits: Optional[int] = None
    semester: Optional[int] = None
    department_id: Optional[int] = None
    faculty_id: Optional[int] = None


class SubjectOut(BaseModel):
    id: int
    subject_code: str
    subject_name: str
    credits: int
    semester: int
    department_id: int
    faculty_id: Optional[int] = None

    model_config = ConfigDict(from_attributes=True)

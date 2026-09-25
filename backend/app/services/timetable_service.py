from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from typing import Optional
from app.models import Timetable, Room, Teacher


class TimetableService:
    @staticmethod
    def check_conflicts(
        db: Session,
        day_of_week: str,
        start_time: str,
        end_time: str,
        room_id: int,
        teacher_id: int,
        exclude_id: Optional[int] = None
    ):
        """
        Ensure no room collision or teacher collision exists for the given slot.
        """
        # 1. Room Conflict Check
        room_conflict_query = db.query(Timetable).filter(
            Timetable.day_of_week == day_of_week,
            Timetable.room_id == room_id,
            Timetable.start_time < end_time,
            Timetable.end_time > start_time
        )
        if exclude_id:
            room_conflict_query = room_conflict_query.filter(Timetable.id != exclude_id)
        
        conflict_room = room_conflict_query.first()
        if conflict_room:
            room = db.query(Room).filter(Room.id == room_id).first()
            room_name = room.room_number if room else f"ID {room_id}"
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Room conflict: {room_name} is already allocated on {day_of_week} between {conflict_room.start_time} and {conflict_room.end_time}."
            )

        # 2. Teacher Conflict Check
        teacher_conflict_query = db.query(Timetable).filter(
            Timetable.day_of_week == day_of_week,
            Timetable.teacher_id == teacher_id,
            Timetable.start_time < end_time,
            Timetable.end_time > start_time
        )
        if exclude_id:
            teacher_conflict_query = teacher_conflict_query.filter(Timetable.id != exclude_id)
        
        conflict_teacher = teacher_conflict_query.first()
        if conflict_teacher:
            teacher = db.query(Teacher).filter(Teacher.id == teacher_id).first()
            teacher_name = teacher.user.full_name if teacher and teacher.user else f"ID {teacher_id}"
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Teacher conflict: Faculty {teacher_name} is already assigned on {day_of_week} from {conflict_teacher.start_time} to {conflict_teacher.end_time}."
            )

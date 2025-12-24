from datetime import datetime
from typing import Optional
from pydantic import BaseModel


class NotificationCreate(BaseModel):
    user_id: str
    analysis_id: str
    title: str
    message: str
    type: str = "feedback_update"  # feedback_update, analysis_correction, system


class NotificationResponse(BaseModel):
    id: str
    user_id: str
    analysis_id: str
    title: str
    message: str
    type: str
    read: bool = False
    created_at: datetime
    
    class Config:
        from_attributes = True
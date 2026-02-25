from sqlalchemy import Column, Integer, String, DateTime
from datetime import datetime
from data.database import Base

class Media(Base):
    __tablename__ = "media"

    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String, index=True)
    content_type = Column(String)
    file_path = Column(String)
    uploaded_at = Column(DateTime, default=datetime.utcnow)

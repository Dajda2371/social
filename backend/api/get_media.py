from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from data import models, database

router = APIRouter()

@router.get("/media/{media_id}")
def get_media(media_id: int, db: Session = Depends(database.get_db)):
    media = db.query(models.Media).filter(models.Media.id == media_id).first()
    if not media:
        raise HTTPException(status_code=404, detail="Media not found")
    
    return FileResponse(media.file_path, media_type=media.content_type)

@router.get("/media")
def list_media(skip: int = 0, limit: int = 100, db: Session = Depends(database.get_db)):
    media_list = db.query(models.Media).offset(skip).limit(limit).all()
    return [{"id": m.id, "filename": m.filename, "content_type": m.content_type, "uploaded_at": m.uploaded_at} for m in media_list]

from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
from sqlalchemy.orm import Session
import models, database
import os
import shutil
import uuid

router = APIRouter()

UPLOAD_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "uploads"))
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.post("/upload")
async def upload_media(file: UploadFile = File(...), db: Session = Depends(database.get_db)):
    if not file.content_type.startswith("image/") and not file.content_type.startswith("video/"):
        raise HTTPException(status_code=400, detail="File must be an image or video")
    
    ext = os.path.splitext(file.filename)[1]
    unique_filename = f"{uuid.uuid4()}{ext}"
    file_path = os.path.join(UPLOAD_DIR, unique_filename)
    
    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
        
    db_media = models.Media(
        filename=file.filename,
        content_type=file.content_type,
        file_path=file_path
    )
    db.add(db_media)
    db.commit()
    db.refresh(db_media)
    
    return {"message": "Successfully uploaded", "id": db_media.id, "filename": db_media.filename, "content_type": db_media.content_type}

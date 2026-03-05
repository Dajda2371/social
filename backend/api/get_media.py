from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
import models, database
from api.deps import get_current_user, get_current_user_optional
import os

router = APIRouter()

@router.get("/media/{media_id}")
def get_media(media_id: int, db: Session = Depends(database.get_db)):
    media = db.query(models.Media).filter(models.Media.id == media_id).first()
    if not media:
        raise HTTPException(status_code=404, detail="Media not found")
    
    return FileResponse(media.file_path, media_type=media.content_type)

@router.get("/media")
def list_media(skip: int = 0, limit: int = 100, db: Session = Depends(database.get_db), current_user: models.User = Depends(get_current_user_optional)):
    media_list = db.query(models.Media).offset(skip).limit(limit).all()
    result = []
    for m in media_list:
        username = None
        if m.user:
            username = m.user.username
            
        is_liked = False
        if current_user:
            is_liked = any(like.user_id == current_user.id for like in m.likes)

        result.append({
            "id": m.id,
            "filename": m.filename,
            "content_type": m.content_type,
            "uploaded_at": m.uploaded_at,
            "user_id": m.user_id,
            "username": username,
            "likes_count": len(m.likes),
            "comments_count": len(m.comments),
            "is_liked": is_liked
        })
    return result

@router.get("/user/{username}/media")
def get_user_media(username: str, db: Session = Depends(database.get_db), current_user: models.User = Depends(get_current_user_optional)):
    """Get all media uploaded by a specific user."""
    user = db.query(models.User).filter(models.User.username == username).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    media_list = db.query(models.Media).filter(models.Media.user_id == user.id).all()
    return {
        "user": {
            "id": user.id,
            "username": user.username
        },
        "media": [
            {
                "id": m.id,
                "filename": m.filename,
                "content_type": m.content_type,
                "uploaded_at": m.uploaded_at,
                "likes_count": len(m.likes),
                "comments_count": len(m.comments),
                "is_liked": any(like.user_id == current_user.id for like in m.likes) if current_user else False
            }
            for m in media_list
        ]
    }

@router.delete("/media/{media_id}")
def delete_media(
    media_id: int,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Delete media - only the owner can delete their own media."""
    media = db.query(models.Media).filter(models.Media.id == media_id).first()
    if not media:
        raise HTTPException(status_code=404, detail="Media not found")
    
    if media.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="You can only delete your own media")
    
    # Delete the file from disk
    if os.path.exists(media.file_path):
        os.remove(media.file_path)
    
    db.delete(media)
    db.commit()
    
    return {"message": "Media deleted successfully"}

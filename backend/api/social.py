from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
import models, database
from api.deps import get_current_user

router = APIRouter()

class CommentCreate(BaseModel):
    content: str
    parent_id: Optional[int] = None

@router.post("/media/{media_id}/like")
def toggle_like(media_id: int, db: Session = Depends(database.get_db), current_user: models.User = Depends(get_current_user)):
    media = db.query(models.Media).filter(models.Media.id == media_id).first()
    if not media:
        raise HTTPException(status_code=404, detail="Media not found")
        
    existing_like = db.query(models.Like).filter(
        models.Like.media_id == media_id,
        models.Like.user_id == current_user.id
    ).first()
    
    if existing_like:
        db.delete(existing_like)
        db.commit()
        liked = False
    else:
        new_like = models.Like(media_id=media_id, user_id=current_user.id)
        db.add(new_like)
        db.commit()
        liked = True
        
    likes_count = db.query(models.Like).filter(models.Like.media_id == media_id).count()
    return {"liked": liked, "likes_count": likes_count}

@router.post("/media/{media_id}/comment")
def add_comment(media_id: int, comment: CommentCreate, db: Session = Depends(database.get_db), current_user: models.User = Depends(get_current_user)):
    media = db.query(models.Media).filter(models.Media.id == media_id).first()
    if not media:
        raise HTTPException(status_code=404, detail="Media not found")
        
    if comment.parent_id:
        parent_comment = db.query(models.Comment).filter(models.Comment.id == comment.parent_id).first()
        if not parent_comment or parent_comment.media_id != media_id:
            raise HTTPException(status_code=400, detail="Invalid parent comment")
            
    new_comment = models.Comment(
        media_id=media_id,
        user_id=current_user.id,
        content=comment.content,
        parent_id=comment.parent_id
    )
    db.add(new_comment)
    db.commit()
    db.refresh(new_comment)
    
    return {
        "id": new_comment.id,
        "content": new_comment.content,
        "username": current_user.username,
        "parent_id": new_comment.parent_id,
        "created_at": new_comment.created_at
    }

@router.get("/media/{media_id}/comments")
def get_comments(media_id: int, db: Session = Depends(database.get_db)):
    comments = db.query(models.Comment).filter(models.Comment.media_id == media_id).order_by(models.Comment.created_at.desc()).all()
    
    result = []
    for c in comments:
        result.append({
            "id": c.id,
            "content": c.content,
            "username": c.user.username if c.user else "Unknown",
            "parent_id": c.parent_id,
            "created_at": c.created_at
        })
    return result

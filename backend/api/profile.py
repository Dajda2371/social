from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
import models, database
from api.deps import get_current_user
import os
import shutil
import uuid

router = APIRouter()

UPLOAD_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "uploads", "profile_pictures"))
os.makedirs(UPLOAD_DIR, exist_ok=True)


@router.post("/profile/picture")
async def upload_profile_picture(
    file: UploadFile = File(...),
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Upload or replace the current user's profile picture."""
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")

    # Delete old profile picture file if exists
    if current_user.profile_picture and os.path.exists(current_user.profile_picture):
        os.remove(current_user.profile_picture)

    ext = os.path.splitext(file.filename)[1]
    unique_filename = f"{uuid.uuid4()}{ext}"
    file_path = os.path.join(UPLOAD_DIR, unique_filename)

    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    current_user.profile_picture = file_path
    db.commit()

    return {
        "message": "Profile picture updated",
        "profile_picture_url": f"/api/user/{current_user.username}/picture"
    }


@router.delete("/profile/picture")
def delete_profile_picture(
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Remove the current user's profile picture."""
    if not current_user.profile_picture:
        raise HTTPException(status_code=404, detail="No profile picture to remove")

    if os.path.exists(current_user.profile_picture):
        os.remove(current_user.profile_picture)

    current_user.profile_picture = None
    db.commit()

    return {"message": "Profile picture removed"}


@router.get("/user/{username}/picture")
def get_profile_picture(username: str, db: Session = Depends(database.get_db)):
    """Get a user's profile picture."""
    user = db.query(models.User).filter(models.User.username == username).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if not user.profile_picture or not os.path.exists(user.profile_picture):
        raise HTTPException(status_code=404, detail="No profile picture")

    return FileResponse(user.profile_picture, media_type="image/jpeg")

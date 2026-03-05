from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
import jwt
import models, database

SECRET_KEY = "my_super_secret_key_that_is_long_enough_for_jwt_32_bytes"
ALGORITHM = "HS256"

security = HTTPBearer()
security_optional = HTTPBearer(auto_error=False)

def _get_user_from_token(token: str, db: Session):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if not username:
            return None
    except Exception:
        return None
    
    return db.query(models.User).filter(models.User.username == username).first()

def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(database.get_db)
):
    """Extract and validate the current user from JWT token."""
    user = _get_user_from_token(credentials.credentials, db)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    return user

def get_current_user_optional(
    credentials: HTTPAuthorizationCredentials = Depends(security_optional),
    db: Session = Depends(database.get_db)
):
    """Extract and validate the current user from JWT token, if present."""
    if not credentials:
        return None
    return _get_user_from_token(credentials.credentials, db)

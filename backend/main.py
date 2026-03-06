from fastapi import FastAPI
from api import upload_media, get_media, auth, social, profile
import models, database
from fastapi.middleware.cors import CORSMiddleware

models.Base.metadata.create_all(bind=database.engine)

# Migrate existing databases: add profile_picture column if missing
with database.engine.connect() as conn:
    from sqlalchemy import text, inspect
    inspector = inspect(database.engine)
    columns = [c['name'] for c in inspector.get_columns('users')]
    if 'profile_picture' not in columns:
        conn.execute(text('ALTER TABLE users ADD COLUMN profile_picture VARCHAR'))
        conn.commit()

app = FastAPI(title="Social App Media API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(upload_media.router, prefix="/api", tags=["media"])
app.include_router(get_media.router, prefix="/api", tags=["media"])
app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(social.router, prefix="/api", tags=["social"])
app.include_router(profile.router, prefix="/api", tags=["profile"])

@app.get("/")
def read_root():
    return {"message": "Welcome to the Social App API"}

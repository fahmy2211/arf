from fastapi import FastAPI, APIRouter, UploadFile, File, HTTPException
from fastapi.staticfiles import StaticFiles
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
import uuid
from datetime import datetime, timezone
import aiofiles
import secrets
import hashlib

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI()

# Create upload directory
UPLOAD_DIR = ROOT_DIR / "uploads"
UPLOAD_DIR.mkdir(exist_ok=True)

# Mount static files with proper media types
class CustomStaticFiles(StaticFiles):
    async def get_response(self, path: str, scope):
        response = await super().get_response(path, scope)
        if path.endswith('.js'):
            response.headers['content-type'] = 'application/javascript'
        return response

# Mount uploads at root level (for direct access if routed correctly)
app.mount("/uploads", CustomStaticFiles(directory=str(UPLOAD_DIR)), name="uploads")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Define Models
class Profile(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    bio: Optional[str] = None
    role: str
    photo_url: Optional[str] = None
    encrypted_id: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ProfileCreate(BaseModel):
    name: str
    bio: Optional[str] = None
    role: str

def generate_encrypted_id():
    """Generate a random encrypted-looking ID"""
    random_bytes = secrets.token_bytes(6)
    return hashlib.sha256(random_bytes).hexdigest()[:12].upper()

# Routes
@api_router.get("/")
async def root():
    return {"message": "Profile Generator API"}

@api_router.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    """Upload profile photo"""
    try:
        # Generate unique filename
        file_ext = file.filename.split('.')[-1]
        filename = f"{uuid.uuid4()}.{file_ext}"
        file_path = UPLOAD_DIR / filename
        
        # Save file
        async with aiofiles.open(file_path, 'wb') as f:
            content = await file.read()
            await f.write(content)
        
        # Return URL
        file_url = f"/uploads/{filename}"
        return {"url": file_url}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/profiles", response_model=Profile)
async def create_profile(profile: ProfileCreate):
    """Create a new profile"""
    try:
        # Generate encrypted ID
        encrypted_id = generate_encrypted_id()
        
        # Create profile object
        profile_obj = Profile(
            **profile.model_dump(),
            encrypted_id=encrypted_id
        )
        
        # Save to database
        doc = profile_obj.model_dump()
        doc['created_at'] = doc['created_at'].isoformat()
        
        await db.profiles.insert_one(doc)
        return profile_obj
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/profiles", response_model=List[Profile])
async def get_profiles():
    """Get all profiles"""
    try:
        profiles = await db.profiles.find({}, {"_id": 0}).to_list(1000)
        
        # Convert ISO string timestamps back to datetime objects
        for profile in profiles:
            if isinstance(profile['created_at'], str):
                profile['created_at'] = datetime.fromisoformat(profile['created_at'])
        
        return profiles
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/profiles/{profile_id}", response_model=Profile)
async def get_profile(profile_id: str):
    """Get profile by ID"""
    try:
        profile = await db.profiles.find_one({"id": profile_id}, {"_id": 0})
        
        if not profile:
            raise HTTPException(status_code=404, detail="Profile not found")
        
        # Convert ISO string timestamp back to datetime object
        if isinstance(profile['created_at'], str):
            profile['created_at'] = datetime.fromisoformat(profile['created_at'])
        
        return profile
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
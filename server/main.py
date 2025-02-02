from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional
from agent import entrypoint
from services.room_service import room_service
from livekit import api, rtc
import asyncio
from config import get_settings



@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup code (before yield)
    print("Starting up...")
    
    # Create background task
    async def background_task():
        while True:
            await entrypoint()
    
    # Start the background task
    task = asyncio.create_task(background_task())
    
    yield
    
    # Shutdown code (after yield)
    print("Shutting down...")
    task.cancel()  # Cancel the background task during shutdown
    try:
        await task
    except asyncio.CancelledError:
        print("Background task cancelled")

app = FastAPI(lifespan=lifespan)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

@app.get("/")
async def root():
    return {"message": "Hello World"}

@app.get("/items/{item_id}")
async def read_item(item_id: int, q: Optional[str] = None):
    return {"item_id": item_id, "q": q}

@app.get("/generate-token")
async def generate_token(identity: str):
    settings = get_settings()
    token = api.AccessToken(settings.livekit_api_key, settings.livekit_api_secret) \
    .with_identity(identity) \
    .with_name(identity) \
    .with_grants(api.VideoGrants(
        room_join=True,
        room='base_room',
    ))
    return {"token": token.to_jwt()}
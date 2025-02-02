from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional
from services.room_service import get_room_service_instance
from livekit import api, rtc
import asyncio
from config import get_settings
from pydantic import BaseModel



@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup code (before yield)
    print("Starting up...")
    yield
    # Shutdown code (after yield)
    print("Shutting down...")


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

class AgentParams(BaseModel):
    # Add the fields you need for the agent
    identity: str
    # Add other fields as needed

@app.post("/add-agent")
async def add_agent(body: AgentParams):
    room_service = get_room_service_instance()
    await room_service.add_agent(body.identity)
    return {"message": "Agent added"}

@app.post("/remove-agent")
async def remove_agent(body: AgentParams):
    room_service = get_room_service_instance()
    await room_service.remove_agent(body.identity)
    return {"message": "Agent removed"}

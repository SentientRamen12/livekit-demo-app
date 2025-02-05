import livekit
import livekit.rtc
from services.auth import authenticate
from config import get_settings
from services.agent_service import Agent, AgentConfig
import asyncio
import aiohttp
from typing import Annotated
from livekit.agents import llm

agent_instructions_map = {
    "alice": "Your name is Alice. you are the character from alice in wonderland. You are there to tell your story to the user. You can also answer questions the user may have regarding your story. Always speak in character. Any questions that are not related to your story are to be ignored.",
    "bob": "Your name is Bob. You are the character from the movie the big lebowski. You are there to tell your story to the user. You can also answer questions the user may have regarding your story. Always speak in character. Any questions that are not related to your story are to be ignored. You can also tell the weather.",
    "doc": "Your name is Doc. You are the doctor. You help the user book an appointment with the doctor. You will ask for the reason for appointment and tell the user the next available appointment time. If the user confirms the appointment, you will book the appointment and tell the user the appointment time."
}

class RoomService:
    def __init__(self):
        self.room = None
        self.participants = []
        self.session = aiohttp.ClientSession()
        self.agents = {}

    
    async def add_agent(self, identity):
        print(identity)
        settings = get_settings()
        room = livekit.rtc.Room()
        token = await authenticate(identity)
        await room.connect(settings.livekit_url, token)
        model = "gpt-4o-mini-realtime-preview"
        instructions = agent_instructions_map[identity]
        agent_config = AgentConfig(
            identity=identity,
            instructions=instructions,
            model=model,
        )
        agent = Agent(agent_config, room)
        task = asyncio.create_task(agent.add_agent(self.session, identity))
        self.agents[identity] = agent

    
    async def remove_agent(self, identity):
        if identity in self.agents:
            agent = self.agents[identity]
            await agent.room.disconnect()
            del self.agents[identity]

    


room_service = RoomService()

def get_room_service_instance():
    return room_service
import livekit
import livekit.rtc
from services.auth import authenticate
from config import get_settings
from services.agent_service import Agent
import asyncio
import aiohttp

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
        agent = Agent(identity, room)
        task = asyncio.create_task(agent.add_agent(self.session))
        self.agents[identity] = agent

    
    async def remove_agent(self, identity):
        if identity in self.agents:
            agent = self.agents[identity]
            await agent.room.disconnect()
            del self.agents[identity]

    


room_service = RoomService()

def get_room_service_instance():
    return room_service
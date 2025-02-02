import livekit
import livekit.rtc
from services.auth import authenticate
from config import get_settings
from services.agent_service import Agent, AgentConfig
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
        model = "gpt-4o-mini-realtime-preview"
        instructions = "You are a voice assistant created by LiveKit. Your interface with users will be voice. You should use short and concise responses, and avoiding usage of unpronouncable punctuation. You were created as a demo to showcase the capabilities of LiveKit's agents framework."
        agent_config = AgentConfig(identity, room, instructions, model, self.session)
        agent = Agent(agent_config)
        task = asyncio.create_task(agent.add_agent())
        self.agents[identity] = agent

    
    async def remove_agent(self, identity):
        if identity in self.agents:
            agent = self.agents[identity]
            await agent.room.disconnect()
            del self.agents[identity]

    


room_service = RoomService()

def get_room_service_instance():
    return room_service
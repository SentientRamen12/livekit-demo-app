from livekit.plugins import openai
from livekit.agents.multimodal import MultimodalAgent
import asyncio
import aiohttp
from pydantic import BaseModel
from livekit.rtc import Room

class AgentConfig(BaseModel):
    identity: str
    room: Room
    instructions: str
    model: str
    session: aiohttp.ClientSession


class Agent:
    def __init__(self, agent_config: AgentConfig):
        self.identity = agent_config.identity
        self.room = agent_config.room # Add a list to track tasks
        self.instructions = agent_config.instructions
        self.model = agent_config.model
        self.session = agent_config.session

        

    async def add_agent(self):
        await asyncio.sleep(1)  # Small delay to ensure initialization
        model = openai.realtime.RealtimeModel(
            instructions=self.instructions,
            modalities=["audio", "text"],
            model=self.model,
            loop=asyncio.get_event_loop(),
            http_session=self.session
        )
        agent = MultimodalAgent(model=model)
        agent.start(self.room)
        

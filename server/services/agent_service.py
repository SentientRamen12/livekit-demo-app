from livekit.plugins import openai
from livekit.agents.multimodal import MultimodalAgent
import asyncio
import aiohttp
from pydantic import BaseModel
from livekit.rtc import Room

class AgentConfig(BaseModel):
    identity: str
    instructions: str
    model: str


class Agent:
    def __init__(self, agent_config: AgentConfig, room: Room):
        self.identity = agent_config.identity
        self.room = room # Add a list to track tasks
        self.instructions = agent_config.instructions
        self.model = agent_config.model

        

    async def add_agent(self, session: aiohttp.ClientSession):
        await asyncio.sleep(1)  # Small delay to ensure initialization
        model = openai.realtime.RealtimeModel(
            instructions=self.instructions,
            modalities=["audio", "text"],
            model=self.model,
            loop=asyncio.get_event_loop(),
            http_session=session
        )
        agent = MultimodalAgent(model=model)
        agent.start(self.room)
        

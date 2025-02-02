from livekit.plugins import openai
from livekit.agents.multimodal import MultimodalAgent
import asyncio
import aiohttp
import concurrent.futures

class Agent:
    def __init__(self, identity, room):
        self.identity = identity
        self.room = room # Add a list to track tasks

        

    async def add_agent(self, session):
        await asyncio.sleep(1)  # Small delay to ensure initialization
        model = openai.realtime.RealtimeModel(
            instructions=(
                "You are a voice assistant created by LiveKit. Your interface with users will be voice. "
                "You should use short and concise responses, and avoiding usage of unpronouncable punctuation. "
                "You were created as a demo to showcase the capabilities of LiveKit's agents framework."
            ),
            modalities=["audio", "text"],
            model="gpt-4o-mini-realtime-preview",
            loop=asyncio.get_event_loop(),
            http_session=session
        )
        agent = MultimodalAgent(model=model)
        agent.start(self.room)
        

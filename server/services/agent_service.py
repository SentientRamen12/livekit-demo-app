from livekit.plugins import openai
from livekit.agents.multimodal import MultimodalAgent
import asyncio
import aiohttp
from pydantic import BaseModel
from livekit.rtc import Room
from typing import Annotated
from livekit.agents import llm

class AgentConfig(BaseModel):
    identity: str
    instructions: str
    model: str


class AssistantFunction(llm.FunctionContext):
    
    @llm.ai_callable()
    async def get_weather(
            self
        ):
        """Get the current weather for a specified location.

        Returns:
            str: A description of the weather conditions
        """
        print("call get_weather")
        return "The weather is sunny"
    
class DoctorFunction(llm.FunctionContext):

    @llm.ai_callable()
    async def get_slots(
            self,
            reason: Annotated[str, llm.TypeInfo(description="The reason for the appointment")]
        ):
        """Get the available slots for the doctor.

        Args:
            reason (str): The reason for the appointment

        Returns:
            str: A list of available slots
        """
        print("call get_slots")
        if reason == "cold":
            slots = ["10:00 AM", "11:00 AM", "12:00 PM"]
        elif reason == "cough":
            slots = ["1:00 PM", "2:00 PM", "3:00 PM", "4:00 PM"]
        else:
            slots = ["5:00 PM"]
        return ", ".join(slots)
    
    @llm.ai_callable()
    async def book_appointment(
            self,
            reason: Annotated[str, llm.TypeInfo(description="The reason for the appointment")],
            slot: Annotated[str, llm.TypeInfo(description="The slot for the appointment")]
        ):
        """Book an appointment with the doctor.

        Args:
            reason (str): The reason for the appointment
            slot (str): The slot for the appointment

        Returns:
            str: The appointment details
        """
        print("call book_appointment")
        return f"Appointment booked for {reason} at {slot}"


class Agent:
    def __init__(self, agent_config: AgentConfig, room: Room):
        self.identity = agent_config.identity
        self.room = room # Add a list to track tasks
        self.instructions = agent_config.instructions
        self.model = agent_config.model

        

    async def add_agent(self, session: aiohttp.ClientSession, identity: str):
        await asyncio.sleep(1)  # Small delay to ensure initialization
        model = openai.realtime.RealtimeModel(
            instructions=self.instructions,
            modalities=["audio", "text"],
            model=self.model,
            loop=asyncio.get_event_loop(),
            http_session=session
        )
        if identity == "doc":
            functions = DoctorFunction()
        else:
            functions = AssistantFunction()
        agent = MultimodalAgent(model=model, fnc_ctx=functions)
        agent.start(self.room)
        

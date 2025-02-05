from __future__ import annotations

import logging
from dotenv import load_dotenv
from typing import Annotated

from livekit import rtc
from livekit.agents import (
    AutoSubscribe,
    JobContext,
    WorkerOptions,
    cli,
    llm,
)
from livekit.agents.multimodal import MultimodalAgent
from livekit.plugins import openai


load_dotenv(dotenv_path=".env.local")
logger = logging.getLogger("my-worker")
logger.setLevel(logging.INFO)

appointments = []

class PMSFunction(llm.FunctionContext):

    @llm.ai_callable()
    async def get_slots(
            self,
            reason: Annotated[str, llm.TypeInfo(description="The reason for the appointment")]
        ):
        """Get the available slots for the dentist.

        Args:
            reason (str): The reason for the appointment, enum: checkup, toothache, wisdom_tooth_extraction, root_canal.

        Returns:
            str: A list of available slots
        """
        print("call get_slots")
        if reason == "checkup":
            slots = ["10:00 AM", "11:00 AM", "12:00 PM"]
        elif reason == "toothache":
            slots = ["1:00 PM", "2:00 PM", "3:00 PM", "4:00 PM"]
        elif reason == "wisdom_tooth_extraction":
            slots = ["5:00 PM", "6:00 PM", "7:00 PM", "8:00 PM"]
        elif reason == "root_canal":
            slots = ["9:00 PM", "10:00 PM", "11:00 PM", "12:00 AM"]
        else:
            slots = ["5:00 PM"]
        return ", ".join(slots)
    
    @llm.ai_callable()
    async def book_appointment(
            self,
            reason: Annotated[str, llm.TypeInfo(description="The reason for the appointment")],
            slot: Annotated[str, llm.TypeInfo(description="The slot for the appointment")],
            name: Annotated[str, llm.TypeInfo(description="The name of the patient")],
            phone: Annotated[str, llm.TypeInfo(description="The phone number of the patient")]
        ):
        """Book an appointment with the doctor.

        Args:
            reason (str): The reason for the appointment
            slot (str): The slot for the appointment
            name (str): The name of the patient
            phone (str): The phone number of the patient

        Returns:
            str: The appointment details
        """
        print("call book_appointment")
        appointments.append({
            "reason": reason,
            "slot": slot,
            "name": name,
            "phone": phone
        })
        return f"Appointment booked for {reason} at {slot} for {name}."
    
    @llm.ai_callable()
    async def get_appointments(
            self,
            name: Annotated[str, llm.TypeInfo(description="The name of the patient")],
        ):
        """Get the appointments for a patient.

        Args:
            name (str): The name of the patient

        Returns:
            str: The appointments for the patient
        """
        print("call get_appointments")
        appointments_for_patient = [appointment for appointment in appointments if appointment["name"] == name]
        return f"Appointments for {name}: {appointments_for_patient}"

async def entrypoint(ctx: JobContext):
    logger.info(f"connecting to room {ctx.room.name}")
    await ctx.connect(auto_subscribe=AutoSubscribe.AUDIO_ONLY)

    participant = await ctx.wait_for_participant()

    run_multimodal_agent(ctx, participant)

    logger.info("agent started")


def run_multimodal_agent(ctx: JobContext, participant: rtc.RemoteParticipant):
    logger.info("starting multimodal agent")

    model = openai.realtime.RealtimeModel(
        instructions=(
            "You are a voice assistant. Your interface with users will be voice. "
            "You should use short and concise responses, and avoiding usage of unpronouncable punctuation. "
            "You help users book appointments with a dentist. You do this by first asking for their reason for the appointment, fetching the available slots, and then booking the appointment."
            "You should be able to handle the following reasons for the appointment: checkup, toothache, wisdom tooth extraction, and root canal."
            "In order to book the appointment, you need to ask for their name, phone number, and the slot they want to book the appointment for."
        ),
        modalities=["audio", "text"],
    )
    agent = MultimodalAgent(model=model, fnc_ctx=PMSFunction())
    agent.start(ctx.room, participant)

    session = model.sessions[0]
    session.conversation.item.create(
        llm.ChatMessage(
            role="assistant",
            content="Please begin the interaction with the user in a manner consistent with your instructions.",
        )
    )
    session.response.create()


if __name__ == "__main__":
    cli.run_app(
        WorkerOptions(
            entrypoint_fnc=entrypoint,
        )
    )

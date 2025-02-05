"use client";

import { LiveKitRoom, VideoConference, useParticipants, RoomName} from "@livekit/components-react";
import { useState, useEffect } from "react";
import { useRouter } from 'next/navigation';
import { v4 as uuidv4 } from 'uuid';
import axios from 'axios';
import { Room } from "livekit-client";

export async function handleAddAgent(identity: string) {
    try {
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
        const response = await axios.post(`${backendUrl}/add-agent`, { identity: identity});
        console.log(response);
    } catch (error) {
        console.error('Error adding agent:', error);
    }
}

export async function handleRemoveAgent(identity: string) {
    try {
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
        const response = await axios.post(`${backendUrl}/remove-agent`, { identity: identity});
        console.log(response);
    } catch (error) {
        console.error('Error removing agent:', error);
    }
}

export function ParticipantsList() {
  const participants = useParticipants();
  const room = RoomName
  
  return (
    <div className="absolute top-4 left-4 bg-white/90 p-3 rounded-lg shadow-md">
      <h3 className="font-semibold mb-2">Participants ({participants.length})</h3>
      <ul className="space-y-1">
        {participants.map((participant) => (
          <li key={participant.identity} className="text-sm flex items-center justify-between">
            {participant.name}
            {participant.identity.startsWith('agent-') && (
              <button
                onClick={() => handleRemoveAgent(participant.identity)}
                className="ml-2 text-red-500 hover:text-red-700"
                aria-label="Remove agent"
              >
                ✕
              </button>
            )}
          </li>
        ))}
      </ul>
      <button
        onClick={() => handleAddAgent(`agent-${uuidv4()}`)}
        className="mt-3 w-full bg-blue-500 text-white px-3 py-1 rounded-md text-sm hover:bg-blue-600 transition-colors"
      >
        Add AI Agent
      </button>
    </div>
  );
}

export default function ChatroomPage() {
  const [token, setToken] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const username = sessionStorage.getItem('username');
    if (!username) {
      router.push('/');
      return;
    }

    const connectToRoom = async () => {
      try {
        const userId = username ?? uuidv4();
        const token = await generateToken(userId, userId);
        setToken(token);
      } catch (error) {
        console.error('Connection error:', error);
        setToken(null);
      }
    };

    connectToRoom();
  }, [router]);

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8 flex items-center justify-center">
      <div className="w-full max-w-2xl h-[600px] border border-gray-200 rounded-lg relative">
        <LiveKitRoom 
          serverUrl={process.env.NEXT_PUBLIC_LIVEKIT_URL}
          token={token}
          connect={true}
          video={true}
          audio={true}
          data-lk-theme="default"
          style={{ height: '100%' }}
        >
          <VideoConference />
          <ParticipantsList />
          <RoomName />
        </LiveKitRoom>
      </div>
    </div>
  );
}

export async function generateToken(identity: string, name: string) {
  try {
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
    const response = await fetch(`${backendUrl}/generate-token?identity=${identity}&name=${name}`);
    const data = await response.json();
    return data.token;
  } catch (error) {
    console.error('Error generating token:', error);
    throw error;
  }
}
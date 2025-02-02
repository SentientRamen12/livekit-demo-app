"use client";

import { LiveKitRoom, VideoConference, useParticipants } from "@livekit/components-react";
import { useState, useEffect } from "react";
import { useRouter } from 'next/navigation';
import { v4 as uuidv4 } from 'uuid';

function ParticipantsList() {
  const participants = useParticipants();
  
  return (
    <div className="absolute top-4 left-4 bg-white/90 p-3 rounded-lg shadow-md">
      <h3 className="font-semibold mb-2">Participants ({participants.length})</h3>
      <ul className="space-y-1">
        {participants.map((participant) => (
          <li key={participant.identity} className="text-sm">
            {participant.name}
          </li>
        ))}
      </ul>
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
        </LiveKitRoom>
      </div>
    </div>
  );
}

async function generateToken(identity: string, name: string) {
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
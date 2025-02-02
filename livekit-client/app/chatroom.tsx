"use client";

import Image from "next/image";
import { LiveKitRoom } from "@livekit/components-react";
import { useState, useEffect } from "react";
import { VideoConference } from "@livekit/components-react";
import { v4 as uuidv4 } from 'uuid';

export default function Chatroom() {
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    console.log('State changed:', { isConnected, token });
  }, [isConnected, token]);

  const onConnectButtonClicked = async () => {
    try {
      const userId = sessionStorage.getItem('username')??uuidv4();
      const token = await generateToken(userId, userId);
      console.log('Token generated:', token);
      setToken(token);
      setIsConnected(true);
    } catch (error) {
      console.error('Connection error:', error);
      setIsConnected(false);
      setToken(null);
    }
  };

  return (
    <div className="min-h-screen p-8 flex items-center justify-center">
      <div className="w-full max-w-2xl h-[600px] border border-gray-200 rounded-lg">
        <div className="w-full h-full p-8 flex flex-col items-center justify-center">
          {!isConnected ? (
            <button 
              onClick={onConnectButtonClicked}
              className="rounded-full bg-foreground text-background px-6 py-3 hover:bg-[#383838] dark:hover:bg-[#ccc] transition-colors"
            >
              Join Chat Room
            </button>
          ) : token ? (
            <LiveKitRoom 
              audio={true} 
              video={true} 
              token={token}
              serverUrl={process.env.NEXT_PUBLIC_LIVEKIT_URL}
              onError={(error) => {
                console.error('LiveKitRoom error:', error);
                setIsConnected(false);
                setToken(null);
              }}
            >
              <div className="w-full h-full">
                <VideoConference />
              </div>
            </LiveKitRoom>
          ) : (
            <div>Loading...</div>
          )}
        </div>
      </div>
    </div>
  );
}

async function generateToken(identity: string, name: string) {
  try {
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
    const response = await fetch(`${backendUrl}/generate-token?identity=${identity}&name=${name}`);
    const data = await response.json();
    console.log('Token response:', data);
    return data.token;
  } catch (error) {
    console.error('Error generating token:', error);
    throw error;
  }
}
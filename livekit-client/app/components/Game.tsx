'use client';

import { useEffect, useRef, useState } from 'react';
import { Engine, Actor, Loader, Color, Keys, CollisionType } from 'excalibur';
import { LiveKitRoom, RoomName, VideoConference } from "@livekit/components-react";
import { generateToken, handleAddAgent, handleRemoveAgent, ParticipantsList } from '../chatroom/page';

export default function Game() {
  const gameRef = useRef(null);
  const [isChatting, setIsChatting] = useState(false);
  const isChattingRef = useRef(false); // ✅ Avoid re-renders in game logic
  const [token, setToken] = useState<string | null>(null);
  const activeNpcRef = useRef<string | null>(null);

  useEffect(() => {
    // Get username and generate token
    const username = sessionStorage.getItem('username');
    if (username) {
      const connectToRoom = async () => {
        try {
          const userId = username;
          const token = await generateToken(userId, userId);
          if (token) {  // Add check to ensure token exists
            setToken(token);
          }
        } catch (error) {
          console.error('Connection error:', error);
          setToken(null);
        }
      };
      connectToRoom();
    }
  }, []);

  useEffect(() => {
    if (!gameRef.current) return;

    const game = new Engine({
      width: 800,
      height: 600,
      canvasElement: gameRef.current,
    });

    const player = new Actor({ 
      x: 400, 
      y: 300, 
      width: 32, 
      height: 32, 
      color: Color.Red, 
      collisionType: CollisionType.Active,
      name: 'Player'
    });
    
    const npc = new Actor({ 
      x: 500, 
      y: 300, 
      width: 32, 
      height: 32, 
      color: Color.Blue, 
      collisionType: CollisionType.Fixed,
      name: 'Bob'
    });
    
    const npc2 = new Actor({ 
      x: 100, 
      y: 200, 
      width: 32, 
      height: 32, 
      color: Color.Green, 
      collisionType: CollisionType.Fixed,
      name: 'Alice'
    });

    game.add(player);
    game.add(npc);
    game.add(npc2);

    const npcs = [npc, npc2];

    // Player Movement
    game.input.keyboard.on("hold", (event) => {
      if (!isChattingRef.current) { // ✅ Prevent re-renders using ref
        switch (event.key) {
          case Keys.W:
            player.vel.y = -100;
            break;
          case Keys.S:
            player.vel.y = 100;
            break;
          case Keys.A:
            player.vel.x = -100;
            break;
          case Keys.D:
            player.vel.x = 100;
            break;
        }
      }
    });

    game.input.keyboard.on("release", (event) => {
      if ([Keys.W, Keys.S].includes(event.key)) player.vel.y = 0;
      if ([Keys.A, Keys.D].includes(event.key)) player.vel.x = 0;
    });

    // Interaction Logic
    game.input.keyboard.on("press", (event) => {
      if (event.key === Keys.X) {
        const distances = npcs.map(npc => player.pos.distance(npc.pos));
        const closestDistance = Math.min(...distances);
        const closestActor = npcs[distances.indexOf(closestDistance)];
        if (closestDistance < 50) { // NPC interaction range
          if (!isChattingRef.current) {
            isChattingRef.current = true; // ✅ Update ref to prevent unnecessary updates
            setIsChatting(true); // ✅ UI updates still happen
            handleAddAgent(closestActor.name);
            activeNpcRef.current = closestActor.name;
            console.log("Chat started with NPC");
          }
        }
      }
      if (event.key === Keys.C) {
        if (isChattingRef.current) {
          isChattingRef.current = false; // ✅ Update ref
          setIsChatting(false); // ✅ UI updates
          if (activeNpcRef.current) {
            handleRemoveAgent(activeNpcRef.current);
            activeNpcRef.current = null;
          }
          console.log("Chat ended");
        }
      }
    });

    game.start();

    return () => {
      game.stop();
    };
  }, []);

  return (
    <div>
      <canvas ref={gameRef} style={{ border: '1px solid black' }} />
      {token && process.env.NEXT_PUBLIC_LIVEKIT_URL && (
        <div className="livekit-container">
          <LiveKitRoom 
            serverUrl={process.env.NEXT_PUBLIC_LIVEKIT_URL}
            token={token}
            connect={true}
            video={false}
            audio={true}
            data-lk-theme="default"
            style={{ height: '100%' }}
          >
            <VideoConference />
            {/* <ParticipantsList /> */}
            <RoomName />
          </LiveKitRoom>
        </div>
      )}
    </div>
  );
}

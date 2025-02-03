'use client';

import { useEffect, useRef, useState } from 'react';
import { Engine, Actor, Loader, Keys, CollisionType, ImageSource, SpriteSheet, Animation, Vector, TileMap } from 'excalibur';
import { LiveKitRoom, RoomName, VideoConference } from "@livekit/components-react";
import { generateToken, handleAddAgent, handleRemoveAgent } from '../chatroom/page';

export default function Game() {
  const gameRef = useRef(null);
  const [isChatting, setIsChatting] = useState(false);
  const isChattingRef = useRef(false);
  const [token, setToken] = useState(null);
  const activeNpcRef = useRef<string | null>(null);

  useEffect(() => {
    const username = sessionStorage.getItem('username');
    if (username) {
      const connectToRoom = async () => {
        try {
          const userId = username;
          const token = await generateToken(userId, userId);
          if (token) {
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

    // Load sprites
    const tilesetImage = new ImageSource('/sprites/tileset.png');
    const characterImage = new ImageSource('/sprites/rogues.png');
    const loader = new Loader([tilesetImage, characterImage]);

    // Create tilemap for the ground
    const tileMap = new TileMap({
      rows: 39,
      columns: 50,
      tileWidth: 16,
      tileHeight: 16
    });

    // Create actors
    const player = new Actor({ 
      x: 400, 
      y: 300, 
      width: 32, 
      height: 32, 
      collisionType: CollisionType.Active,
      name: 'Player'
    });
    
    const npc = new Actor({ 
      x: 500, 
      y: 300, 
      width: 32, 
      height: 32, 
      collisionType: CollisionType.Fixed,
      name: 'bob'
    });
    
    const npc2 = new Actor({ 
      x: 100, 
      y: 200, 
      width: 32, 
      height: 32, 
      collisionType: CollisionType.Fixed,
      name: 'alice'
    });

    // Create plant/obstacle factory
    const createPlant = (x: number, y: number) => {
      const plant = new Actor({
        x,
        y,
        width: 16,
        height: 16,
        collisionType: CollisionType.Fixed,
        name: 'plant'
      });
      return plant;
    };

    // Add some plants as obstacles
    const plants = [
      createPlant(200, 150),
      createPlant(600, 400),
      createPlant(300, 500),
      createPlant(700, 200),
      createPlant(450, 350),
      createPlant(150, 400)
    ];

    // Start game with loader   
    game.start(loader).then(() => {
      // Create tileset spritesheet
      const tilesSpriteSheet = SpriteSheet.fromImageSource({
        image: tilesetImage,
        grid: {
          rows: 19,
          columns: 25,
          spriteWidth: 16,
          spriteHeight: 16
        }
      });

      // Create character spritesheet
      const characterSpriteSheet = SpriteSheet.fromImageSource({
        image: characterImage,
        grid: {
          rows: 6,
          columns: 7,
          spriteWidth: 32,
          spriteHeight: 32
        }
      });

      
      // Fill tilemap with varied ground tiles
      for (let row = 0; row < tileMap.rows; row++) {
        for (let col = 0; col < tileMap.columns; col++) {
          // Generate random numbers for tile variation
          const random = Math.random();
          let spriteX = 0;
          let spriteY = 0;

          // 70% chance of regular grass (0,0)
          // 15% chance of flower grass (1,0)
          // 15% chance of alternate grass (0,1)
          if (random < 0.70) {
            spriteX = 0;
            spriteY = 0;
          } else if (random < 0.85) {
            spriteX = 6;
            spriteY = 8;
          } else {
            spriteX = 0;
            spriteY = 7;
          }

          const tileSprite = tilesSpriteSheet.getSprite(spriteX, spriteY);
          tileMap?.getTile(col, row)?.addGraphic(tileSprite);
        }
      }

      // Add tilemap to game FIRST
      game.add(tileMap);

      // Set character sprites and add actors AFTER tilemap
      player.graphics.use(characterSpriteSheet.getSprite(0, 0));
      npc.graphics.use(characterSpriteSheet.getSprite(1, 0));
      npc2.graphics.use(characterSpriteSheet.getSprite(2, 0));
      game.add(player);
      game.add(npc);
      game.add(npc2);

      // Set plant sprites and add them LAST
      plants.forEach((plant, index) => {
        const spriteX = 6;
        const spriteY = 12;
        plant.graphics.use(tilesSpriteSheet.getSprite(spriteX, spriteY));
        game.add(plant);
      });
    });

    // Player Movement
    game.input.keyboard.on("hold", (event) => {
      if (!isChattingRef.current) {
        const speed = 100;
        switch (event.key) {
          case Keys.W:
            player.vel.y = -speed;
            break;
          case Keys.S:
            player.vel.y = speed;
            break;
          case Keys.A:
            player.vel.x = -speed;
            break;
          case Keys.D:
            player.vel.x = speed;
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
        const distances = [npc, npc2].map(npc => player.pos.distance(npc.pos));
        const closestDistance = Math.min(...distances);
        const closestActor = [npc, npc2][distances.indexOf(closestDistance)];
        if (closestDistance < 50) {
          if (!isChattingRef.current) {
            isChattingRef.current = true;
            setIsChatting(true);
            handleAddAgent(closestActor.name);
            activeNpcRef.current = closestActor.name;
            console.log("Chat started with " + closestActor.name);
          }
        }
      }
      if (event.key === Keys.C) {
        if (isChattingRef.current) {
          isChattingRef.current = false;
          setIsChatting(false);
          if (activeNpcRef.current) {
            handleRemoveAgent(activeNpcRef.current);
            activeNpcRef.current = null;
          }
          console.log("Chat ended");
        }
      }
    });

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
            <RoomName />
          </LiveKitRoom>
        </div>
      )}
    </div>
  );
}
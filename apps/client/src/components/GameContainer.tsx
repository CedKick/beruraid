import { useEffect, useRef, useState } from 'react';
import Phaser from 'phaser';
import { GameScene } from '../game/GameScene';
import { GameUI } from './GameUI';
import { socketService } from '../networking/SocketService';
import './GameContainer.css';
import type { GameMode } from './LobbyScreen';

interface GameContainerProps {
  playerCount: number;
  characterId: string;
  gameMode: GameMode;
  roomCode?: string;
}

export function GameContainer({ playerCount, characterId, gameMode, roomCode }: GameContainerProps) {
  const gameRef = useRef<HTMLDivElement>(null);
  const phaserGameRef = useRef<Phaser.Game | null>(null);
  const [gameScene, setGameScene] = useState<Phaser.Scene | null>(null);

  useEffect(() => {
    if (!gameRef.current) return;

    const config: Phaser.Types.Core.GameConfig = {
      type: Phaser.AUTO,
      width: 1600,
      height: 1000,
      parent: gameRef.current,
      backgroundColor: '#1a1a2e',
      physics: {
        default: 'arcade',
        arcade: {
          gravity: { x: 0, y: 0 },
          debug: false,
        },
      },
      scene: [GameScene],
    };

    phaserGameRef.current = new Phaser.Game(config);

    // Get the scene after a short delay and pass game config
    setTimeout(() => {
      const scene = phaserGameRef.current?.scene.getScene('GameScene') as GameScene;
      if (scene) {
        // Initialize game with config
        scene.initializeGame({
          playerCount,
          characterId,
          gameMode,
          roomCode,
        });
        setGameScene(scene);
      }
    }, 100);

    return () => {
      if (phaserGameRef.current) {
        phaserGameRef.current.destroy(true);
        phaserGameRef.current = null;
      }

      // Disconnect socket when leaving multiplayer game
      if (gameMode === 'multiplayer') {
        socketService.disconnect();
        console.log('🔌 Disconnected from multiplayer session');
      }
    };
  }, [playerCount, characterId, gameMode, roomCode]);

  return (
    <div className="game-container">
      <div className="game-info-bar">
        <div className="game-mode">
          {gameMode === 'solo' ? 'Solo Mode' : `Multiplayer - ${playerCount} Players`}
          {roomCode && <span className="room-code-display"> | Room: {roomCode}</span>}
        </div>
      </div>

      <div ref={gameRef} className="game-canvas" />

      <GameUI gameScene={gameScene} />
    </div>
  );
}

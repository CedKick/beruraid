import { useState, useEffect } from 'react';
import { socketService } from '../networking/SocketService';
import type { PlayerState } from '@beruraid/shared';
import './LobbyScreen.css';

export type GameMode = 'solo' | 'multiplayer';

interface LobbyScreenProps {
  characterName: string;
  characterId: string;
  onStartGame: (mode: GameMode, playerCount: number, roomCode?: string) => void;
}

export function LobbyScreen({ characterName, characterId, onStartGame }: LobbyScreenProps) {
  const [mode, setMode] = useState<GameMode | null>(null);
  const [playerCount, setPlayerCount] = useState(2);
  const [roomCode, setRoomCode] = useState('');
  const [isCreatingRoom, setIsCreatingRoom] = useState(false);
  const [isJoiningRoom, setIsJoiningRoom] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState('');
  const [playersInRoom, setPlayersInRoom] = useState<PlayerState[]>([]);
  const [currentRoomId, setCurrentRoomId] = useState('');

  // Connect to server when component mounts
  useEffect(() => {
    socketService.connect();

    // Listen for room events
    const socket = socketService.getSocket();
    if (socket) {
      socket.on('room:playerJoined', (player) => {
        setPlayersInRoom(prev => [...prev, player]);
      });

      socket.on('room:playerLeft', (data) => {
        setPlayersInRoom(prev => prev.filter(p => p.socketId !== data.playerId));
      });

      socket.on('error', (data) => {
        setError(data.message);
        setIsConnecting(false);
      });
    }

    return () => {
      socketService.disconnect();
    };
  }, []);

  const handleCreateRoom = async () => {
    setIsConnecting(true);
    setError('');

    try {
      const response = await socketService.createRoom({
        playerName: characterName,
        characterId: characterId,
        maxPlayers: playerCount,
      });

      if (response.success && response.roomCode && response.roomId) {
        setRoomCode(response.roomCode);
        setCurrentRoomId(response.roomId);
        setIsCreatingRoom(true);

        // Add self to players list
        setPlayersInRoom([{
          id: 'temp',
          socketId: socketService.getSocketId() || '',
          name: characterName,
          characterId: characterId,
          position: { x: 0, y: 0 },
          stats: {} as any,
          direction: 'down',
          isDodging: false,
          isAlive: true,
          lastUpdateTime: Date.now(),
        }]);
      } else {
        setError(response.error || 'Failed to create room');
      }
    } catch (err) {
      setError('Connection error. Please try again.');
      console.error(err);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleStartSolo = () => {
    onStartGame('solo', 1);
  };

  const handleStartMultiplayer = () => {
    if (isCreatingRoom && roomCode && playersInRoom.length >= 1) {
      onStartGame('multiplayer', playersInRoom.length, roomCode);
    }
  };

  const handleJoinRoom = async () => {
    if (!roomCode.trim()) return;

    setIsConnecting(true);
    setError('');

    try {
      const response = await socketService.joinRoom({
        roomCode: roomCode,
        playerName: characterName,
        characterId: characterId,
      });

      if (response.success && response.roomId && response.players) {
        setCurrentRoomId(response.roomId);
        setPlayersInRoom(response.players);
        setIsJoiningRoom(false);
        setIsCreatingRoom(true); // Show the room view

        // Get actual player count from server
        setPlayerCount(response.players.length);
      } else {
        setError(response.error || 'Failed to join room');
      }
    } catch (err) {
      setError('Connection error. Please try again.');
      console.error(err);
    } finally {
      setIsConnecting(false);
    }
  };

  if (mode === null) {
    return (
      <div className="lobby-screen">
        <div className="lobby-container">
          <div className="lobby-header">
            <h1>Select Game Mode</h1>
            <div className="selected-character-info">
              <span className="character-badge">{characterName}</span>
            </div>
          </div>

          <div className="mode-selection">
            <div className="mode-card" onClick={() => setMode('solo')}>
              <div className="mode-icon">🗡️</div>
              <h2>Solo Raid</h2>
              <p>Face the boss alone. Lower difficulty, standard rewards.</p>
            </div>

            <div className="mode-card" onClick={() => setMode('multiplayer')}>
              <div className="mode-icon">⚔️</div>
              <h2>Multiplayer Raid</h2>
              <p>Team up with other hunters. Difficulty scales with players.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (mode === 'solo') {
    return (
      <div className="lobby-screen">
        <div className="lobby-container">
          <div className="lobby-header">
            <button className="back-btn" onClick={() => setMode(null)}>
              ← Back
            </button>
            <h1>Solo Raid</h1>
          </div>

          <div className="solo-info">
            <div className="info-card">
              <h3>⚔️ Solo Challenge</h3>
              <p>Face the boss alone and prove your strength!</p>
              <ul>
                <li>Boss HP: Standard (100 HP)</li>
                <li>Time Limit: 3 minutes</li>
                <li>Difficulty: Balanced for solo play</li>
              </ul>
            </div>
          </div>

          <button className="start-raid-btn" onClick={handleStartSolo}>
            Start Solo Raid
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="lobby-screen">
      <div className="lobby-container">
        <div className="lobby-header">
          <button className="back-btn" onClick={() => setMode(null)}>
            ← Back
          </button>
          <h1>Multiplayer Lobby</h1>
        </div>

        {!isCreatingRoom && !isJoiningRoom ? (
          <div className="multiplayer-options">
            <div className="option-card" onClick={handleCreateRoom}>
              <div className="option-icon">➕</div>
              <h2>Create Room</h2>
              <p>Start a new raid room and invite other hunters</p>
            </div>

            <div className="option-card" onClick={() => setIsJoiningRoom(true)}>
              <div className="option-icon">🔍</div>
              <h2>Join Room</h2>
              <p>Enter a room code to join an existing raid</p>
            </div>
          </div>
        ) : isJoiningRoom ? (
          <div className="join-room-section">
            <h2>Join a Room</h2>
            <div className="room-input-container">
              <input
                type="text"
                placeholder="Enter Room Code"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                maxLength={6}
                className="room-code-input"
              />
            </div>
            <div className="button-group">
              <button className="secondary-btn" onClick={() => setIsJoiningRoom(false)}>
                Cancel
              </button>
              <button
                className="start-raid-btn"
                onClick={handleJoinRoom}
                disabled={roomCode.length < 6}
              >
                Join Room
              </button>
            </div>
          </div>
        ) : (
          <div className="create-room-section">
            {error && (
              <div className="error-message">
                ⚠️ {error}
              </div>
            )}

            <div className="room-code-display">
              <h2>Room Code</h2>
              <div className="room-code">{roomCode}</div>
              <p className="room-code-hint">Share this code with other hunters</p>
            </div>

            <div className="players-in-room">
              <h3>Players in Room ({playersInRoom.length})</h3>
              <div className="player-list">
                {playersInRoom.map((player, index) => (
                  <div key={player.socketId || index} className="player-item">
                    <span className="player-name">{player.name}</span>
                    <span className="player-character">{player.characterId}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="player-count-section">
              <h3>Expected Players (Max {playerCount})</h3>
              <p className="difficulty-info">
                Boss HP will scale: {Math.floor(100 * Math.pow(1.5, playersInRoom.length - 1))} HP
              </p>
            </div>

            <div className="raid-info">
              <h3>Raid Information</h3>
              <ul>
                <li>Time Limit: 3 minutes</li>
                <li>Progressive HP Bars (x1.69 multiplier)</li>
                <li>Defeat HP bars to gain Rage Points</li>
                <li>Overflow damage carries to next bar</li>
              </ul>
            </div>

            <div className="button-group">
              <button className="secondary-btn" onClick={() => setIsCreatingRoom(false)}>
                Cancel
              </button>
              <button className="start-raid-btn" onClick={handleStartMultiplayer}>
                Start Raid
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

import { useState, useEffect, useRef } from 'react';
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
  const [isConfiguringRoom, setIsConfiguringRoom] = useState(false);
  const [isJoiningRoom, setIsJoiningRoom] = useState(false);
  const [isBrowsingRooms, setIsBrowsingRooms] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState('');
  const [playersInRoom, setPlayersInRoom] = useState<PlayerState[]>([]);
  const [currentRoomId, setCurrentRoomId] = useState('');
  const [currentRoomCode, setCurrentRoomCode] = useState('');
  const [isHost, setIsHost] = useState(false);
  const [isPlayerReady, setIsPlayerReady] = useState(false);
  const [isPrivate, setIsPrivate] = useState(false);
  const [publicRooms, setPublicRooms] = useState<any[]>([]);

  // Use refs to avoid unnecessary re-renders
  const currentRoomCodeRef = useRef(currentRoomCode);
  const playersInRoomRef = useRef(playersInRoom);

  // Update refs when values change
  useEffect(() => {
    currentRoomCodeRef.current = currentRoomCode;
    playersInRoomRef.current = playersInRoom;
  }, [currentRoomCode, playersInRoom]);

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

      socket.on('room:joined', (data) => {
        // Update player list when room updates
        setPlayersInRoom(data.players);
      });

      socket.on('room:started', () => {
        // Start the game when server says raid has started
        if (currentRoomCodeRef.current) {
          onStartGame('multiplayer', playersInRoomRef.current.length, currentRoomCodeRef.current);
        }
      });

      socket.on('error', (data) => {
        setError(data.message);
        setIsConnecting(false);
      });

      socket.on('room:kicked', () => {
        setError('You have been kicked from the room');
        setIsCreatingRoom(false);
        setPlayersInRoom([]);
        setCurrentRoomCode('');
        setCurrentRoomId('');
        setIsHost(false);
        setIsPlayerReady(false);
      });
    }

    // Socket cleanup is handled in App.tsx when returning to menu
    // Don't disconnect here as we need the socket for the game
  }, [onStartGame]);

  const handleCreateRoom = async () => {
    setIsConnecting(true);
    setError('');

    try {
      const response = await socketService.createRoom({
        playerName: characterName,
        characterId: characterId,
        maxPlayers: playerCount,
        isPrivate: isPrivate,
      });

      if (response.success && response.roomCode && response.roomId) {
        setRoomCode(response.roomCode);
        setCurrentRoomCode(response.roomCode);
        setCurrentRoomId(response.roomId);
        setIsConfiguringRoom(false);
        setIsCreatingRoom(true);
        setIsHost(true);

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
          isReady: false,
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

  const handleToggleReady = () => {
    const socket = socketService.getSocket();
    if (!socket) return;

    // Toggle ready status
    const newReadyStatus = !isPlayerReady;
    setIsPlayerReady(newReadyStatus);

    if (newReadyStatus) {
      // Send ready event to server
      socket.emit('player:ready');
    }
  };

  const handleStartMultiplayer = () => {
    if (!isHost) {
      setError('Only the host can start the raid');
      return;
    }

    const allReady = playersInRoom.every(p => p.isReady || p.socketId === socketService.getSocketId());
    if (!allReady && !isPlayerReady) {
      setError('All players must be ready');
      return;
    }

    // Send room:start event to server
    const socket = socketService.getSocket();
    if (socket) {
      socket.emit('room:start');
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
        setCurrentRoomCode(roomCode);
        setPlayersInRoom(response.players);
        setIsJoiningRoom(false);
        setIsBrowsingRooms(false);
        setIsCreatingRoom(true); // Show the room view
        setIsHost(false);

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

  const handleBrowseRooms = async () => {
    setIsBrowsingRooms(true);
    setError('');

    try {
      const serverUrl = import.meta.env.VITE_SERVER_URL || 'http://localhost:3000';
      const response = await fetch(`${serverUrl}/api/rooms/public`);
      const data = await response.json();
      setPublicRooms(data.rooms || []);
    } catch (err) {
      setError('Failed to fetch public rooms');
      console.error(err);
    }
  };

  const handleJoinPublicRoom = async (code: string) => {
    setRoomCode(code);
    await handleJoinRoom();
  };

  const handleKickPlayer = (targetSocketId: string) => {
    const socket = socketService.getSocket();
    if (!socket || !isHost) return;

    socket.emit('room:kick', { targetSocketId }, (response) => {
      if (!response.success) {
        setError(response.error || 'Failed to kick player');
      }
    });
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

        {!isCreatingRoom && !isJoiningRoom && !isBrowsingRooms && !isConfiguringRoom ? (
          <div className="multiplayer-options">
            <div className="option-card" onClick={() => { setIsConfiguringRoom(true); setError(''); }}>
              <div className="option-icon">➕</div>
              <h2>Create Room</h2>
              <p>Start a new raid room and invite other hunters</p>
            </div>

            <div className="option-card" onClick={handleBrowseRooms}>
              <div className="option-icon">📋</div>
              <h2>Browse Public Rooms</h2>
              <p>Join an open raid room</p>
            </div>

            <div className="option-card" onClick={() => setIsJoiningRoom(true)}>
              <div className="option-icon">🔍</div>
              <h2>Join by Code</h2>
              <p>Enter a room code to join an existing raid</p>
            </div>
          </div>
        ) : isBrowsingRooms ? (
          <div className="browse-rooms-section">
            <h2>Public Rooms</h2>
            {publicRooms.length === 0 ? (
              <p className="no-rooms">No public rooms available</p>
            ) : (
              <div className="rooms-list">
                {publicRooms.map((room) => (
                  <div key={room.id} className="room-item" onClick={() => handleJoinPublicRoom(room.code)}>
                    <div className="room-info">
                      <span className="room-code">{room.code}</span>
                      <span className="room-host">Host: {room.hostName}</span>
                      <span className="room-players">{room.playerCount}/{room.maxPlayers} players</span>
                    </div>
                    <button className="join-room-btn">Join</button>
                  </div>
                ))}
              </div>
            )}
            <button className="secondary-btn" onClick={() => setIsBrowsingRooms(false)}>
              Back
            </button>
          </div>
        ) : isConfiguringRoom ? (
          <div className="configure-room-section">
            <h2>Configure Room</h2>
            <div className="room-settings">
              <div className="setting-item">
                <label>Max Players</label>
                <input
                  type="number"
                  min="2"
                  max="6"
                  value={playerCount}
                  onChange={(e) => setPlayerCount(Math.min(6, Math.max(2, parseInt(e.target.value) || 2)))}
                  className="player-count-input"
                />
              </div>
              <div className="setting-item">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={isPrivate}
                    onChange={(e) => setIsPrivate(e.target.checked)}
                  />
                  <span>Private Room (only joinable by code)</span>
                </label>
              </div>
            </div>
            <div className="button-group">
              <button className="secondary-btn" onClick={() => setIsConfiguringRoom(false)}>
                Cancel
              </button>
              <button className="start-raid-btn" onClick={handleCreateRoom} disabled={isConnecting}>
                {isConnecting ? 'Creating...' : 'Create Room'}
              </button>
            </div>
          </div>
        ) : isJoiningRoom && !isCreatingRoom ? (
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
                {playersInRoom.map((player, index) => {
                  const isCurrentPlayer = player.socketId === socketService.getSocketId();
                  const canKick = isHost && !isCurrentPlayer;
                  return (
                    <div key={player.socketId || index} className="player-item">
                      <span className="player-name">
                        {player.name}
                        {isCurrentPlayer && ' (You)'}
                      </span>
                      <span className="player-character">{player.characterId}</span>
                      <span className={`player-status ${(isCurrentPlayer ? isPlayerReady : player.isReady) ? 'ready' : 'not-ready'}`}>
                        {(isCurrentPlayer ? isPlayerReady : player.isReady) ? '✓ Ready' : '○ Not Ready'}
                      </span>
                      {canKick && (
                        <button
                          className="kick-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleKickPlayer(player.socketId);
                          }}
                        >
                          Kick
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="ready-button-container">
              <button
                className={`ready-btn ${isPlayerReady ? 'ready' : ''}`}
                onClick={handleToggleReady}
                disabled={isPlayerReady}
              >
                {isPlayerReady ? '✓ Ready' : 'Mark as Ready'}
              </button>
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
              {isHost ? (
                <button
                  className="start-raid-btn"
                  onClick={handleStartMultiplayer}
                  disabled={!isPlayerReady || !playersInRoom.every(p => p.isReady || p.socketId === socketService.getSocketId())}
                >
                  {!isPlayerReady ? 'Mark yourself ready first' : 'Start Raid'}
                </button>
              ) : (
                <button className="start-raid-btn" disabled>
                  Waiting for host...
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

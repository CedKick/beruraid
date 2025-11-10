import express from 'express';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';
import { RoomManager } from './game/RoomManager.js';
import type {
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData,
} from '@beruraid/shared';

const app = express();
const server = http.createServer(app);
const io = new SocketIOServer<
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData
>(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

const PORT = process.env.PORT || 3000;

// Initialize Room Manager
const roomManager = new RoomManager();

// Game Loop - 60 FPS (16.67ms per tick)
const TICK_RATE = 60;
const TICK_INTERVAL = 1000 / TICK_RATE;

setInterval(() => {
  const activeRooms = roomManager.getActiveRooms();

  for (const room of activeRooms) {
    const gameState = room.update();

    if (gameState) {
      // Broadcast game state to all players in the room
      io.to(room.id).emit('game:stateUpdate', gameState);

      // Check if raid is completed
      if (gameState.isCompleted) {
        const winner = gameState.boss.hp <= 0 ? 'players' : 'boss';
        io.to(room.id).emit('game:completed', {
          winner,
          stats: {
            totalTime: gameState.elapsedTime,
            players: gameState.players,
            bossHp: gameState.boss.hp
          }
        });
      }
    }
  }
}, TICK_INTERVAL);

console.log(`🎮 Game loop started at ${TICK_RATE} FPS`);

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: Date.now(),
    uptime: process.uptime()
  });
});

app.get('/api/stats', (req, res) => {
  res.json({
    connectedPlayers: io.engine.clientsCount,
    activeRooms: roomManager.getAllRoomsInfo().length,
    rooms: roomManager.getAllRoomsInfo()
  });
});

// Socket.io Events
io.on('connection', (socket) => {
  console.log(`✅ Client connected: ${socket.id}`);

  // Room: Create
  socket.on('room:create', (data, callback) => {
    const response = roomManager.createRoom(data, socket.id);

    if (response.success && response.roomId) {
      // Join socket room
      socket.join(response.roomId);

      // Notify client
      socket.emit('room:created', {
        roomId: response.roomId,
        roomCode: response.roomCode!
      });
    }

    callback(response);
  });

  // Room: Join
  socket.on('room:join', (data, callback) => {
    const response = roomManager.joinRoom(data, socket.id);

    if (response.success && response.roomId) {
      // Join socket room
      socket.join(response.roomId);

      // Get room
      const room = roomManager.getRoom(response.roomId);
      if (room) {
        // Notify all players in room
        io.to(response.roomId).emit('room:playerJoined', response.players![response.players!.length - 1]);

        // Send current players to new player
        socket.emit('room:joined', {
          roomId: response.roomId,
          players: response.players!
        });
      }
    }

    callback(response);
  });

  // Room: Leave
  socket.on('room:leave', () => {
    const room = roomManager.getRoomBySocketId(socket.id);
    if (room) {
      const roomId = room.id;

      // Leave socket room
      socket.leave(roomId);

      // Remove player from room
      roomManager.leaveRoom(socket.id);

      // Notify others
      io.to(roomId).emit('room:playerLeft', { playerId: socket.id });
    }
  });

  // Room: Start (host starts the raid)
  socket.on('room:start', () => {
    const room = roomManager.getRoomBySocketId(socket.id);
    if (room) {
      // Check if socket is the host
      if (!room.isHost(socket.id)) {
        socket.emit('error', { message: 'Only the host can start the raid' });
        return;
      }

      // Check if all players are ready
      if (!room.areAllPlayersReady()) {
        socket.emit('error', { message: 'All players must be ready' });
        return;
      }

      try {
        room.startRaid();

        // Notify all players
        io.to(room.id).emit('room:started');

        console.log(`🎯 Raid started in room ${room.id}`);
      } catch (error) {
        console.error('Error starting raid:', error);
        socket.emit('error', { message: 'Failed to start raid' });
      }
    }
  });

  // Player: Ready
  socket.on('player:ready', () => {
    const room = roomManager.getRoomBySocketId(socket.id);
    if (room) {
      const success = room.setPlayerReady(socket.id, true);
      if (success) {
        // Broadcast updated player list to all players
        const players = room.getPlayers();
        io.to(room.id).emit('room:joined', {
          roomId: room.id,
          players: players
        });

        console.log(`✅ Player ${socket.id} is ready in room ${room.id}`);
      }
    }
  });

  // Player Update - broadcast position/state to other players
  socket.on('player:update', (state) => {
    const room = roomManager.getRoomBySocketId(socket.id);
    if (room) {
      // Broadcast to all other players in the same room
      socket.to(room.id).emit('game:playerUpdate', {
        ...state,
        socketId: socket.id,
        id: state.id || socket.id,
        name: state.name || 'Unknown',
        characterId: state.characterId || 'stark',
        lastUpdateTime: Date.now()
      } as any);
    }
  });

  // Game: Movement
  socket.on('game:movement', (input) => {
    const room = roomManager.getRoomBySocketId(socket.id);
    if (room) {
      room.handlePlayerMovement(socket.id, input);
    }
  });

  // Game: Dodge
  socket.on('game:dodge', () => {
    const room = roomManager.getRoomBySocketId(socket.id);
    if (room) {
      room.handlePlayerDodge(socket.id);
    }
  });

  // Game: Attack
  socket.on('game:attack', (data) => {
    const room = roomManager.getRoomBySocketId(socket.id);
    if (room) {
      room.handlePlayerAttack(socket.id, data);
    }
  });

  // Game: Skill
  socket.on('game:skill', (data) => {
    const room = roomManager.getRoomBySocketId(socket.id);
    if (room) {
      room.handlePlayerSkill(socket.id, data);
    }
  });

  // Disconnect
  socket.on('disconnect', () => {
    console.log(`❌ Client disconnected: ${socket.id}`);

    // Auto-leave room on disconnect
    const room = roomManager.getRoomBySocketId(socket.id);
    if (room) {
      const roomId = room.id;
      roomManager.leaveRoom(socket.id);
      io.to(roomId).emit('room:playerLeft', { playerId: socket.id });
    }
  });
});

// Start Server
server.listen(PORT, () => {
  console.log(`\n🚀 BeruRaid Server Running`);
  console.log(`📡 Port: ${PORT}`);
  console.log(`🌍 Health: http://localhost:${PORT}/health`);
  console.log(`🎮 Ready for connections!\n`);
});

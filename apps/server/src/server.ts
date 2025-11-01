import express from 'express';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';

const app = express();
const server = http.createServer(app);
const io = new SocketIOServer(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

const PORT = process.env.PORT || 3000;

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
    activeRooms: 0 // TODO: Implement room tracking
  });
});

// Socket.io Events
io.on('connection', (socket) => {
  console.log(`✅ Client connected: ${socket.id}`);

  socket.on('player:join', (data) => {
    console.log(`👤 Player joined: ${data.name || 'Anonymous'}`);
    socket.emit('player:joined', {
      playerId: socket.id,
      timestamp: Date.now()
    });
  });

  socket.on('disconnect', () => {
    console.log(`❌ Client disconnected: ${socket.id}`);
  });
});

// Start Server
server.listen(PORT, () => {
  console.log(`\n🚀 BeruRaid Server Running`);
  console.log(`📡 Port: ${PORT}`);
  console.log(`🌍 Health: http://localhost:${PORT}/health`);
  console.log(`🎮 Ready for connections!\n`);
});

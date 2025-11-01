import { useEffect, useState } from 'react';
import { socketService } from './networking/SocketService';
import './App.css';

function App() {
  const [isConnected, setIsConnected] = useState(false);
  const [playerId, setPlayerId] = useState<string>('');

  useEffect(() => {
    // Connect to server
    socketService.connect();

    // Listen for connection events
    socketService.on('connect', () => {
      console.log('✅ Connected to server');
      setIsConnected(true);
    });

    socketService.on('disconnect', () => {
      console.log('❌ Disconnected from server');
      setIsConnected(false);
    });

    socketService.on('player:joined', (data: { playerId: string }) => {
      console.log('👤 Player joined:', data.playerId);
      setPlayerId(data.playerId);
    });

    // Cleanup on unmount
    return () => {
      socketService.disconnect();
    };
  }, []);

  const handleJoin = () => {
    socketService.emit('player:join', {
      name: 'TestPlayer',
      class: 'warrior'
    });
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>🎮 BeruRaid - Solo Leveling</h1>
        <div className="status">
          Status: {isConnected ? '🟢 Connected' : '🔴 Disconnected'}
        </div>
        {playerId && <div className="player-id">Player ID: {playerId}</div>}
      </header>

      <main className="app-main">
        {isConnected ? (
          <div className="lobby">
            <h2>Lobby</h2>
            <button onClick={handleJoin} className="btn-join">
              Join Raid
            </button>
            <div className="info">
              <p>🎯 Phase 1: Basic connection test</p>
              <p>📡 Server: localhost:3000</p>
            </div>
          </div>
        ) : (
          <div className="connecting">
            <p>Connecting to server...</p>
          </div>
        )}
      </main>

      <footer className="app-footer">
        <p>BeruRaid v1.0.0 - Alpha Build</p>
      </footer>
    </div>
  );
}

export default App;

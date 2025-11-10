import { useState } from 'react';
import { CharacterSelection } from './components/CharacterSelection';
import { LobbyScreen } from './components/LobbyScreen';
import { GameContainer } from './components/GameContainer';
import { CHARACTERS } from './game/types/Character';
import type { GameMode } from './components/LobbyScreen';
import './App.css';

type AppState = 'characterSelection' | 'lobby' | 'game';

interface GameConfig {
  characterId: string;
  mode: GameMode;
  playerCount: number;
  roomCode?: string;
}

function App() {
  const [appState, setAppState] = useState<AppState>('characterSelection');
  const [gameConfig, setGameConfig] = useState<GameConfig>({
    characterId: '',
    mode: 'solo',
    playerCount: 1,
  });

  const handleCharacterSelected = (characterId: string) => {
    setGameConfig(prev => ({ ...prev, characterId }));
    setAppState('lobby');
  };

  const handleStartGame = (mode: GameMode, playerCount: number, roomCode?: string) => {
    setGameConfig(prev => ({ ...prev, mode, playerCount, roomCode }));
    setAppState('game');
  };

  const selectedCharacter = gameConfig.characterId ? CHARACTERS[gameConfig.characterId] : null;

  return (
    <div className="app">
      {appState === 'characterSelection' && (
        <CharacterSelection onCharacterSelected={handleCharacterSelected} />
      )}

      {appState === 'lobby' && selectedCharacter && (
        <LobbyScreen
          characterName={selectedCharacter.name}
          characterId={gameConfig.characterId}
          onStartGame={handleStartGame}
        />
      )}

      {appState === 'game' && (
        <GameContainer
          playerCount={gameConfig.playerCount}
          characterId={gameConfig.characterId}
          gameMode={gameConfig.mode}
          roomCode={gameConfig.roomCode}
        />
      )}
    </div>
  );
}

export default App;

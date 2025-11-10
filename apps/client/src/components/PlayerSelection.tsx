import { useState } from 'react';
import './PlayerSelection.css';

interface PlayerSelectionProps {
  onStartGame: (playerCount: number) => void;
}

export function PlayerSelection({ onStartGame }: PlayerSelectionProps) {
  const [selectedCount, setSelectedCount] = useState(1);

  return (
    <div className="player-selection">
      <h1>🎮 BeruRaid - Boss Raid</h1>

      <div className="selection-content">
        <h2>Select Number of Players</h2>

        <div className="player-count-grid">
          {[1, 2, 3, 4, 5, 6].map((count) => (
            <button
              key={count}
              className={`player-count-btn ${selectedCount === count ? 'selected' : ''}`}
              onClick={() => setSelectedCount(count)}
            >
              <span className="count">{count}</span>
              <span className="label">{count === 1 ? 'Solo' : 'Players'}</span>
            </button>
          ))}
        </div>

        <div className="game-info">
          <h3>Controls</h3>
          <div className="controls">
            <div className="control-item">
              <span className="key">Z Q S D</span>
              <span className="action">Move</span>
            </div>
            <div className="control-item">
              <span className="key">Space</span>
              <span className="action">Dodge (0.5s invincibility)</span>
            </div>
            <div className="control-item">
              <span className="key">A</span>
              <span className="action">Skill 1</span>
            </div>
            <div className="control-item">
              <span className="key">E</span>
              <span className="action">Skill 2</span>
            </div>
          </div>
        </div>

        <button
          className="start-btn"
          onClick={() => onStartGame(selectedCount)}
        >
          Start Raid
        </button>
      </div>
    </div>
  );
}

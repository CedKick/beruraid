import './Leaderboard.css';

export interface PlayerScore {
  name: string;
  characterId: string;
  dps: number;
  hps: number;
  totalDamage: number;
  totalHeal: number;
  isAlive: boolean;
  isMe?: boolean;
}

interface LeaderboardProps {
  players: PlayerScore[];
}

export function Leaderboard({ players }: LeaderboardProps) {
  // Sort by DPS descending
  const sortedPlayers = [...players].sort((a, b) => b.dps - a.dps);

  return (
    <div className="leaderboard">
      <div className="leaderboard-header">
        <h3>Leaderboard</h3>
      </div>

      <div className="leaderboard-list">
        {sortedPlayers.map((player, index) => (
          <div
            key={player.name}
            className={`leaderboard-player ${player.isMe ? 'is-me' : ''} ${!player.isAlive ? 'is-dead' : ''}`}
          >
            <div className="player-rank">#{index + 1}</div>

            <div className="player-info">
              <div className="player-name">
                {player.name}
                {!player.isAlive && <span className="dead-badge">💀</span>}
              </div>
              <div className="player-char">{getCharacterName(player.characterId)}</div>
            </div>

            <div className="player-stats">
              <div className="stat-item">
                <span className="stat-label">DPS</span>
                <span className="stat-value damage">{Math.floor(player.dps)}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">DMG</span>
                <span className="stat-value">{formatNumber(player.totalDamage)}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">HPS</span>
                <span className="stat-value heal">{Math.floor(player.hps)}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Heal</span>
                <span className="stat-value">{formatNumber(player.totalHeal)}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function getCharacterName(characterId: string): string {
  const names: Record<string, string> = {
    stark: 'Stark',
    fern: 'Fern',
    frieren: 'Frieren',
    guts: 'Guts',
  };
  return names[characterId] || characterId;
}

function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return Math.floor(num).toString();
}

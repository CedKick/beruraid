import { useState, memo } from 'react';
import './StatsPanel.css';

interface PlayerStats {
  level: number;
  experience: number;
  experienceToNextLevel: number;
  statPoints: number;
  maxHp: number;
  currentHp: number;
  maxMana: number;
  currentMana: number;
  attack: number;
  defense: number;
  defPen: number;
  critDamage: number;
  critRate: number;
  attackSpeed: number;
  damageBoost: number;
}

interface StatsPanelProps {
  stats: PlayerStats;
  gameScene: Phaser.Scene | null;
}

// PERFORMANCE: Memoize to prevent unnecessary re-renders
export const StatsPanel = memo(function StatsPanel({ stats, gameScene }: StatsPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const addStatPoint = (stat: keyof PlayerStats) => {
    if (gameScene && stats.statPoints > 0) {
      gameScene.events.emit('addStatPoint', stat);
    }
  };

  const expPercent = (stats.experience / stats.experienceToNextLevel) * 100;

  return (
    <div className={`stats-panel ${isExpanded ? 'expanded' : ''}`}>
      <div className="stats-header" onClick={() => setIsExpanded(!isExpanded)}>
        <div className="player-level">Niveau {stats.level}</div>
        <div className="stat-points">
          {stats.statPoints > 0 && (
            <span className="points-available">
              {stats.statPoints} points disponibles
            </span>
          )}
        </div>
        <div className="expand-icon">{isExpanded ? '▼' : '▶'}</div>
      </div>

      <div className="exp-bar">
        <div className="exp-fill" style={{ width: `${expPercent}%` }} />
        <div className="exp-text">
          XP: {stats.experience} / {stats.experienceToNextLevel}
        </div>
      </div>

      {isExpanded && (
        <div className="stats-content">
          <div className="stats-grid">
            <StatRow
              label="HP Max"
              value={stats.maxHp}
              increment="+10"
              canAdd={stats.statPoints > 0}
              onAdd={() => addStatPoint('maxHp')}
            />
            <StatRow
              label="Mana Max"
              value={stats.maxMana}
              increment="+5"
              canAdd={stats.statPoints > 0}
              onAdd={() => addStatPoint('maxMana')}
            />
            <StatRow
              label="Attaque"
              value={stats.attack}
              increment="+2"
              canAdd={stats.statPoints > 0}
              onAdd={() => addStatPoint('attack')}
            />
            <StatRow
              label="Défense"
              value={stats.defense}
              increment="+1"
              canAdd={stats.statPoints > 0}
              onAdd={() => addStatPoint('defense')}
            />
            <StatRow
              label="Pén. Déf"
              value={stats.defPen}
              increment="+1"
              canAdd={stats.statPoints > 0}
              onAdd={() => addStatPoint('defPen')}
            />
            <StatRow
              label="Dégâts Crit"
              value={`${stats.critDamage}%`}
              increment="+5%"
              canAdd={stats.statPoints > 0}
              onAdd={() => addStatPoint('critDamage')}
            />
            <StatRow
              label="Taux Crit"
              value={`${stats.critRate}%`}
              increment="+1%"
              canAdd={stats.statPoints > 0}
              onAdd={() => addStatPoint('critRate')}
            />
            <StatRow
              label="Vit. Attaque"
              value={stats.attackSpeed.toFixed(2)}
              increment="+0.05"
              canAdd={stats.statPoints > 0}
              onAdd={() => addStatPoint('attackSpeed')}
            />
            <StatRow
              label="Bonus Dégâts"
              value={`${stats.damageBoost}%`}
              increment="+2%"
              canAdd={stats.statPoints > 0}
              onAdd={() => addStatPoint('damageBoost')}
            />
          </div>
        </div>
      )}
    </div>
  );
});

interface StatRowProps {
  label: string;
  value: string | number;
  increment: string;
  canAdd: boolean;
  onAdd: () => void;
}

function StatRow({ label, value, increment, canAdd, onAdd }: StatRowProps) {
  return (
    <div className="stat-row">
      <div className="stat-label">{label}</div>
      <div className="stat-value">{value}</div>
      <button
        className="stat-add-btn"
        disabled={!canAdd}
        onClick={onAdd}
        title={`Ajouter ${increment}`}
      >
        +
      </button>
    </div>
  );
}

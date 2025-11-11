import { useEffect, useState } from 'react';
import { StatsPanel } from './StatsPanel';
import { Leaderboard, type PlayerScore } from './Leaderboard';
import './GameUI.css';

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

interface GameState {
  playerHp: number;
  playerMaxHp: number;
  playerMana: number;
  playerMaxMana: number;
  playerLevel: number;
  playerExp: number;
  playerExpToNext: number;
  playerStats: PlayerStats;
  bossHp: number;
  bossMaxHp: number;
  bossRageCount: number;
  bossBarsDefeated: number;
  bossNextBarMaxHp: number;
  bossTotalDamage: number;
  bossBarMultiplier: number;
  skill1Cooldown: number;
  skill2Cooldown: number;
  ultimateCooldown: number;
  isDodging: boolean;
  remainingTime: string;
  remainingTimeSeconds: number;
  isTimeCritical: boolean;
  isTimeWarning: boolean;
  dps: number;
  totalDamage: number;
  hps: number;
  totalHeal: number;
  playerScores?: PlayerScore[];
  isPlayerDead?: boolean;
}

interface GameUIProps {
  gameScene: Phaser.Scene | null;
}

export function GameUI({ gameScene }: GameUIProps) {
  const [gameState, setGameState] = useState<GameState>({
    playerHp: 100,
    playerMaxHp: 100,
    playerMana: 50,
    playerMaxMana: 50,
    playerLevel: 1,
    playerExp: 0,
    playerExpToNext: 100,
    playerStats: {
      level: 1,
      experience: 0,
      experienceToNextLevel: 100,
      statPoints: 0,
      maxHp: 100,
      currentHp: 100,
      maxMana: 50,
      currentMana: 50,
      attack: 10,
      defense: 5,
      defPen: 0,
      critDamage: 150,
      critRate: 5,
      attackSpeed: 1,
      damageBoost: 0,
    },
    bossHp: 100,
    bossMaxHp: 100,
    bossRageCount: 0,
    bossBarsDefeated: 0,
    bossNextBarMaxHp: 169,
    bossTotalDamage: 0,
    bossBarMultiplier: 1,
    skill1Cooldown: 0,
    skill2Cooldown: 0,
    ultimateCooldown: 0,
    isDodging: false,
    remainingTime: '3:00',
    remainingTimeSeconds: 180,
    isTimeCritical: false,
    isTimeWarning: false,
    dps: 0,
    totalDamage: 0,
    hps: 0,
    totalHeal: 0,
  });
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [showVictory, setShowVictory] = useState(false);

  useEffect(() => {
    if (!gameScene) return;

    const handleGameStateUpdate = (state: GameState) => {
      setGameState(state);
    };

    const handleLevelUp = () => {
      setShowLevelUp(true);
      setTimeout(() => setShowLevelUp(false), 3000);
    };

    const handleBossDefeated = () => {
      setShowVictory(true);
    };

    gameScene.events.on('gameStateUpdate', handleGameStateUpdate);
    gameScene.events.on('playerLevelUp', handleLevelUp);
    gameScene.events.on('bossDefeated', handleBossDefeated);

    return () => {
      gameScene.events.off('gameStateUpdate', handleGameStateUpdate);
      gameScene.events.off('playerLevelUp', handleLevelUp);
      gameScene.events.off('bossDefeated', handleBossDefeated);
    };
  }, [gameScene]);

  const playerHpPercent = (gameState.playerHp / gameState.playerMaxHp) * 100;
  const playerManaPercent = (gameState.playerMana / gameState.playerMaxMana) * 100;
  const bossHpPercent = (gameState.bossHp / gameState.bossMaxHp) * 100;

  return (
    <div className="game-ui">
      {/* Stats Panel */}
      <StatsPanel stats={gameState.playerStats} gameScene={gameScene} />

      {/* Level Up Notification */}
      {showLevelUp && (
        <div className="level-up-notification">
          <div className="level-up-text">NIVEAU SUPÉRIEUR!</div>
          <div className="level-up-sub">Niveau {gameState.playerLevel}</div>
        </div>
      )}

      {/* Victory Notification */}
      {showVictory && (
        <div className="victory-notification">
          <div className="victory-text">VICTOIRE!</div>
          <div className="victory-sub">Boss vaincu!</div>
        </div>
      )}

      {/* Player HP */}
      <div className="player-hud">
        <div className="hp-container">
          <div className="hp-label">HP</div>
          <div className="hp-bar">
            <div
              className="hp-fill player-hp"
              style={{ width: `${playerHpPercent}%` }}
            />
            <div className="hp-text">
              {Math.floor(gameState.playerHp)} / {Math.floor(gameState.playerMaxHp)}
            </div>
          </div>
        </div>

        {/* Mana Bar */}
        <div className="mana-container">
          <div className="mana-label">Mana</div>
          <div className="mana-bar">
            <div
              className="mana-fill"
              style={{ width: `${playerManaPercent}%` }}
            />
            <div className="mana-text">
              {Math.floor(gameState.playerMana)} / {gameState.playerMaxMana}
            </div>
          </div>
        </div>

        {/* Skills */}
        <div className="skills">
          <div className={`skill ${gameState.skill1Cooldown > 0 ? 'cooldown' : ''}`}>
            <div className="skill-key">A</div>
            <div className="skill-name">Fireball</div>
            {gameState.skill1Cooldown > 0 && (
              <div
                className="skill-cooldown-overlay"
                style={{ height: `${gameState.skill1Cooldown * 100}%` }}
              />
            )}
          </div>

          <div className={`skill ${gameState.skill2Cooldown > 0 ? 'cooldown' : ''}`}>
            <div className="skill-key">E</div>
            <div className="skill-name">Explosion</div>
            {gameState.skill2Cooldown > 0 && (
              <div
                className="skill-cooldown-overlay"
                style={{ height: `${gameState.skill2Cooldown * 100}%` }}
              />
            )}
          </div>

          {gameState.ultimateCooldown !== undefined && (
            <div className={`skill ultimate ${gameState.ultimateCooldown > 0 ? 'cooldown' : ''}`}>
              <div className="skill-key">R</div>
              <div className="skill-name">Ultimate</div>
              {gameState.ultimateCooldown > 0 && (
                <div
                  className="skill-cooldown-overlay"
                  style={{ height: `${gameState.ultimateCooldown * 100}%` }}
                />
              )}
            </div>
          )}

          <div className={`skill dodge ${gameState.isDodging ? 'active' : ''}`}>
            <div className="skill-key">Space</div>
            <div className="skill-name">Dodge</div>
          </div>
        </div>
      </div>

      {/* Combat Timer */}
      <div className={`combat-timer ${gameState.isTimeCritical ? 'critical' : gameState.isTimeWarning ? 'warning' : ''}`}>
        <div className="timer-icon">⏱️</div>
        <div className="timer-value">{gameState.remainingTime}</div>
      </div>

      {/* Leaderboard (Right Side) */}
      {gameState.playerScores && gameState.playerScores.length > 0 && (
        <Leaderboard players={gameState.playerScores} />
      )}

      {/* Boss HP */}
      <div className="boss-hud">
        <div className="boss-header">
          <div className="boss-name">🐲 Boss Ant <span className="multiplier-badge">X{gameState.bossBarMultiplier}</span></div>
          <div className="boss-stats">
            <div className="rage-counter">
              <span className="rage-icon">🔥</span>
              <span className="rage-label">Rage</span>
              <span className="rage-value">{gameState.bossRageCount}</span>
            </div>
            <div className="bars-defeated">
              <span className="bars-label">Bars Defeated:</span>
              <span className="bars-value">{gameState.bossBarsDefeated}</span>
            </div>
          </div>
        </div>

        <div className="boss-hp-section">
          <div className="hp-bar boss">
            <div
              className="hp-fill boss-hp"
              style={{ width: `${bossHpPercent}%` }}
            />
            <div className="hp-text">
              {Math.floor(gameState.bossHp)} / {gameState.bossMaxHp}
            </div>
          </div>

          <div className="next-bar-info">
            <span>Next Bar: {gameState.bossNextBarMaxHp} HP</span>
            <span className="total-damage">Total DMG: {Math.floor(gameState.bossTotalDamage)}</span>
          </div>
        </div>
      </div>

      {/* Death Overlay */}
      {gameState.isPlayerDead && (
        <div className="death-overlay">
          <div className="death-message">
            <h1>💀 VOUS ÊTES MORT 💀</h1>
            <p>Votre aventure prend fin ici...</p>
            <button
              className="return-menu-btn"
              onClick={() => {
                window.location.href = '/';
              }}
            >
              Retour au Menu
            </button>
          </div>
        </div>
      )}

      {/* Controls reminder */}
      <div className="controls-hint">
        ZQSD: Déplacer | Clic G: Mêlée | Clic D: Distance | Space: Esquive | A/E: Skills
      </div>
    </div>
  );
}

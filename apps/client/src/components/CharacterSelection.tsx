import { useState } from 'react';
import { CHARACTERS } from '../game/types/Character';
import './CharacterSelection.css';

interface CharacterSelectionProps {
  onCharacterSelected: (characterId: string) => void;
}

export function CharacterSelection({ onCharacterSelected }: CharacterSelectionProps) {
  const [selectedCharacter, setSelectedCharacter] = useState<string | null>(null);
  const [hoveredCharacter, setHoveredCharacter] = useState<string | null>(null);

  const characters = Object.values(CHARACTERS);
  const displayCharacter = hoveredCharacter || selectedCharacter;
  const currentCharacter = displayCharacter ? CHARACTERS[displayCharacter] : null;

  const handleSelectCharacter = (characterId: string) => {
    setSelectedCharacter(characterId);
  };

  const handleStartGame = () => {
    if (selectedCharacter) {
      onCharacterSelected(selectedCharacter);
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'Tank': return '#e74c3c';
      case 'Mage': return '#9b59b6';
      case 'Support': return '#3498db';
      case 'DPS': return '#e67e22';
      default: return '#95a5a6';
    }
  };

  const getElementColor = (element: string) => {
    switch (element) {
      case 'Fire': return '#ff6b6b';
      case 'Water': return '#4ecdc4';
      case 'Earth': return '#a8e6cf';
      case 'Wind': return '#95e1d3';
      case 'Lightning': return '#ffd93d';
      default: return '#95a5a6';
    }
  };

  return (
    <div className="character-selection">
      <div className="selection-header">
        <h1>🎮 BeruRaid</h1>
        <h2>Choose Your Hunter</h2>
      </div>

      <div className="selection-container">
        <div className="character-grid">
          {characters.map((char) => (
            <div
              key={char.id}
              className={`character-card ${selectedCharacter === char.id ? 'selected' : ''}`}
              onClick={() => handleSelectCharacter(char.id)}
              onMouseEnter={() => setHoveredCharacter(char.id)}
              onMouseLeave={() => setHoveredCharacter(null)}
            >
              <div className="character-portrait">
                <div
                  className="character-icon"
                  style={{
                    background: `linear-gradient(135deg, ${getRoleColor(char.role)}, ${getElementColor(char.element)})`
                  }}
                >
                  <span className="character-initial">{char.name[0]}</span>
                </div>
              </div>
              <div className="character-info">
                <h3>{char.name}</h3>
                <div className="character-tags">
                  <span className="role-tag" style={{ backgroundColor: getRoleColor(char.role) }}>
                    {char.role}
                  </span>
                  <span className="element-tag" style={{ backgroundColor: getElementColor(char.element) }}>
                    {char.element}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="character-details">
          {currentCharacter ? (
            <>
              <div className="details-header">
                <div
                  className="details-icon"
                  style={{
                    background: `linear-gradient(135deg, ${getRoleColor(currentCharacter.role)}, ${getElementColor(currentCharacter.element)})`
                  }}
                >
                  <span className="character-initial-large">{currentCharacter.name[0]}</span>
                </div>
                <div className="details-title">
                  <h2>{currentCharacter.name}</h2>
                  <p className="description">{currentCharacter.description}</p>
                </div>
              </div>

              <div className="stats-section">
                <h3>Base Stats</h3>
                <div className="stats-grid">
                  <div className="stat-item">
                    <span className="stat-label">HP</span>
                    <span className="stat-value">{currentCharacter.stats.baseHp}</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">ATK</span>
                    <span className="stat-value">{currentCharacter.stats.baseAtk}</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">DEF</span>
                    <span className="stat-value">{currentCharacter.stats.baseDef}</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Mana</span>
                    <span className="stat-value">{currentCharacter.stats.baseMana}</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Crit Rate</span>
                    <span className="stat-value">{currentCharacter.stats.baseCritRate}%</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Crit DMG</span>
                    <span className="stat-value">{currentCharacter.stats.baseCritDmg}%</span>
                  </div>
                </div>
              </div>

              <div className="skills-section">
                <h3>Skills</h3>
                <div className="skill-item">
                  <div className="skill-header">
                    <span className="skill-key">A</span>
                    <span className="skill-name">{currentCharacter.skills.skill1.name}</span>
                  </div>
                  <p className="skill-desc">{currentCharacter.skills.skill1.description}</p>
                  <div className="skill-stats">
                    <span>CD: {currentCharacter.skills.skill1.cooldown / 1000}s</span>
                    <span>Mana: {currentCharacter.skills.skill1.manaCost}</span>
                    {currentCharacter.skills.skill1.damage && currentCharacter.skills.skill1.damage > 0 && (
                      <span>DMG: {currentCharacter.skills.skill1.damage}</span>
                    )}
                  </div>
                </div>

                <div className="skill-item">
                  <div className="skill-header">
                    <span className="skill-key">E</span>
                    <span className="skill-name">{currentCharacter.skills.skill2.name}</span>
                  </div>
                  <p className="skill-desc">{currentCharacter.skills.skill2.description}</p>
                  <div className="skill-stats">
                    <span>CD: {currentCharacter.skills.skill2.cooldown / 1000}s</span>
                    <span>Mana: {currentCharacter.skills.skill2.manaCost}</span>
                    {currentCharacter.skills.skill2.damage && currentCharacter.skills.skill2.damage > 0 && (
                      <span>DMG: {currentCharacter.skills.skill2.damage}</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="passive-section">
                <h3>Passive</h3>
                <div className="passive-item">
                  <h4>{currentCharacter.passive.name}</h4>
                  <p>{currentCharacter.passive.description}</p>
                </div>
              </div>
            </>
          ) : (
            <div className="no-selection">
              <p>Select a character to view details</p>
            </div>
          )}
        </div>
      </div>

      <div className="selection-footer">
        <div className="controls-info">
          <h3>Controls</h3>
          <div className="controls-grid">
            <div className="control-item">
              <span className="key">ZQSD</span>
              <span className="action">Move</span>
            </div>
            <div className="control-item">
              <span className="key">Space</span>
              <span className="action">Dodge</span>
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
          onClick={handleStartGame}
          disabled={!selectedCharacter}
        >
          {selectedCharacter ? 'Start Raid' : 'Select a Character'}
        </button>
      </div>
    </div>
  );
}

# Solo Leveling: Raid Battle - Projet de Jeu Multijoueur

**Date de conception**: 2025-10-31
**Objectif**: Créer un jeu de raid boss multijoueur en temps réel intégré à BuilderBeru

---

## 🎮 Concept du Jeu

### Vue d'Ensemble
Un jeu de raid boss coopératif inspiré de **Realm of the Mad God** avec les mécaniques de Solo Leveling: Arise.

### Caractéristiques Principales
- **Vue**: Top-down (vue du dessus)
- **Boss**: Statue Géante avec patterns de combat
- **Joueurs**: 2-6 joueurs par raid
- **Durée**: 3 minutes par combat
- **Objectif**: Maximiser les dégâts d'équipe

### Système de Classement
- **Classement Général**: Qui fait le plus de dégâts total
- **Twist Important**: Les meilleurs ne sont pas forcément ceux qui font le plus de dégâts individuels
- **Synergie d'Équipe**: L'équipe qui fait le plus de dégâts collectifs gagne
- **Rôles**: Support / Breaker / DPS / Tank

---

## 🎯 Fonctionnalités à Implémenter

### A. Système de Personnages (Hunters)
- [ ] Sélection de classe/hunter
- [ ] Stats de base (HP, Mana, ATK, DEF, Speed)
- [ ] Compétences actives (Skills)
- [ ] Compétence ultime (Ulti)

### B. Système de Combat
#### Contrôles Joueur
- [ ] **Déplacement** (ZQSD / Joystick)
- [ ] **Esquive** (Dash/Roll avec cooldown)
- [ ] **Auto Attack** (Clic gauche)
- [ ] **Auto Attack 2** (Combo)
- [ ] **Skill 1** (Touche A / Bouton 1)
- [ ] **Skill 2** (Touche E / Bouton 2)
- [ ] **Ultime** (Touche R / Bouton 3)
- [ ] **Potion de Vie** (Touche 1)
- [ ] **Potion de Mana** (Touche 2)

#### Système de Ressources
- [ ] Barre de vie (HP)
- [ ] Barre de mana
- [ ] Cooldowns des compétences
- [ ] Inventaire de potions

### C. Boss: Statue Géante
#### Patterns d'Attaque
- [ ] **Lasers** (attaques en ligne)
- [ ] **Cercles Oranges** (zones AoE à esquiver)
- [ ] **Attaques de Zone** (patterns variés)
- [ ] **Phases de Break** (2x mini statues à détruire)

#### Mécaniques Boss
- [ ] Système de phases (0-100%, 50%, break phases)
- [ ] Points faibles / Break bars
- [ ] Enrage timer (3 minutes)
- [ ] Patterns aléatoires/scriptés

### D. Systèmes de Jeu
- [ ] **Système de Dégâts**: Calcul serveur autoritatif
- [ ] **Collision Detection**: Hitboxes précises
- [ ] **Système de Buffs/Debuffs**: Support skills
- [ ] **Combo System**: Synergie entre joueurs
- [ ] **Death/Revive**: Mort et réanimation
- [ ] **Victory/Defeat**: Conditions de victoire

### E. Interface Utilisateur
- [ ] **HUD en jeu**: HP/Mana/Cooldowns
- [ ] **Mini-map**: Positions joueurs/boss
- [ ] **DPS Meter**: Dégâts en temps réel
- [ ] **Team Composition**: Rôles des joueurs
- [ ] **Post-Game Stats**: Écran récapitulatif
- [ ] **Leaderboard**: Classement général

### F. Matchmaking & Lobbies
- [ ] **Recherche de groupe**: Queue système
- [ ] **Lobby d'attente**: Pre-game room
- [ ] **Chat**: Communication joueurs
- [ ] **Ready Check**: Validation avant démarrage

---

## 🏗️ Architecture Technique

### Option Recommandée: **Projet Séparé**

```
Structure Proposée:
solo-leveling-raid/
├── client/                      # Frontend React + Moteur de jeu
│   ├── src/
│   │   ├── game/               # Game engine
│   │   │   ├── entities/       # Player, Boss, Projectile
│   │   │   ├── systems/        # Combat, Movement, Collision
│   │   │   ├── rendering/      # Canvas/WebGL rendering
│   │   │   └── networking/     # Socket.io client
│   │   ├── ui/                 # React UI components
│   │   ├── assets/             # Sprites, sounds
│   │   └── utils/              # Helpers
│   ├── package.json
│   └── vite.config.js
│
├── server/                      # Backend Node.js + Socket.io
│   ├── src/
│   │   ├── game/               # Server-side game logic
│   │   │   ├── GameRoom.js     # Room management (max 6 players)
│   │   │   ├── BossEntity.js   # Boss AI et patterns
│   │   │   ├── PlayerEntity.js # Player state
│   │   │   ├── DamageSystem.js # Damage calculation
│   │   │   └── CollisionSystem.js # Server-side collision
│   │   ├── networking/         # Socket.io handlers
│   │   ├── database/           # PostgreSQL/Redis
│   │   └── leaderboard/        # Ranking system
│   ├── package.json
│   └── server.js
│
├── shared/                      # Code partagé client/serveur
│   ├── types/                  # TypeScript types
│   ├── constants/              # Game constants
│   └── validators/             # Input validation
│
└── package.json                # Monorepo root
```

### Stack Technique

#### Backend (VPS)
```
- Node.js (v18+)
- Express.js (API REST)
- Socket.io (WebSocket temps réel)
- PostgreSQL (données persistantes: classements, stats)
- Redis (sessions, cache, matchmaking queue)
- PM2 (Process manager pour production)
```

#### Frontend
```
- React 19
- Socket.io-client
- Canvas API / Phaser.js / PixiJS (à décider)
- Framer Motion (UI animations)
- Tailwind CSS
```

#### DevOps
```
- VPS (serveur de jeu)
- Nginx (Reverse proxy)
- SSL/TLS (HTTPS/WSS)
- PM2 (Auto-restart, logs)
```

---

## 🎨 Choix du Moteur de Rendu

### Option 1: **Canvas Natif**
```
Avantages:
✅ Léger (pas de dépendances)
✅ Contrôle total
✅ Parfait pour jeu simple top-down

Inconvénients:
❌ Plus de code à écrire
❌ Pas d'optimisations built-in
```

### Option 2: **Phaser.js** ⭐ RECOMMANDÉ
```
Avantages:
✅ Game engine complet
✅ Physique intégrée
✅ Asset loading
✅ Scene management
✅ Développement rapide
✅ Grande communauté

Inconvénients:
❌ Bundle plus lourd (~1MB)
```

### Option 3: **PixiJS**
```
Avantages:
✅ WebGL performant
✅ Rendering 2D optimisé
✅ Léger que Phaser

Inconvénients:
❌ Pas de physique intégrée
❌ Plus bas niveau
```

---

## 🔄 Architecture Réseau

### Modèle Client-Serveur Autoritatif

```
Client                          Server
  │                              │
  │─────── Input (Move) ────────>│
  │                              │ Validate Input
  │                              │ Update Game State
  │                              │ Physics Simulation
  │<───── Game State Update ─────│
  │                              │
  │ Interpolate                  │
  │ Predict                      │
  │ Render                       │
```

### Principes Clés
1. **Server Autoritatif**: Toute la logique critique côté serveur (anti-cheat)
2. **Client Prediction**: Le client prédit ses mouvements pour réactivité
3. **Server Reconciliation**: Le serveur corrige les écarts
4. **Entity Interpolation**: Mouvement fluide des autres joueurs
5. **Tick Rate**: 60 ticks/sec (ou 30 pour économiser bande passante)

### Messages Socket.io

```javascript
// Client -> Server
{
  'player:input': { keys, mousePos, timestamp },
  'player:skill': { skillId, target, timestamp },
  'player:ready': { playerId }
}

// Server -> Client
{
  'game:state': { players, boss, projectiles, timestamp },
  'game:damage': { sourceId, targetId, amount, type },
  'game:phase': { phase, bossHP },
  'game:end': { winner, stats }
}
```

---

## 📊 Système de Classement

### Types de Classements

1. **Individual DPS**: Dégâts individuels max
2. **Team DPS**: Dégâts d'équipe combinés (le plus important)
3. **Support Score**: Buffs/Heals fournis
4. **Survival Time**: Temps sans mourir
5. **Break Contribution**: Dégâts sur phases de break

### Base de Données (PostgreSQL)

```sql
-- Tables principales
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE,
  total_damage BIGINT DEFAULT 0,
  raids_played INT DEFAULT 0,
  best_run_damage INT DEFAULT 0
);

CREATE TABLE raid_sessions (
  id SERIAL PRIMARY KEY,
  timestamp TIMESTAMP DEFAULT NOW(),
  duration INT,
  team_damage BIGINT,
  victory BOOLEAN
);

CREATE TABLE player_stats (
  id SERIAL PRIMARY KEY,
  user_id INT REFERENCES users(id),
  raid_id INT REFERENCES raid_sessions(id),
  damage_dealt INT,
  damage_taken INT,
  healing_done INT,
  deaths INT,
  hunter_class VARCHAR(50)
);
```

---

## 🔐 Sécurité & Anti-Cheat

### Mesures Serveur
- ✅ Validation de tous les inputs client
- ✅ Rate limiting des actions (éviter spam)
- ✅ Vérification des cooldowns serveur
- ✅ Hitbox validation serveur
- ✅ Timestamps pour détecter latency manipulation
- ✅ Logs d'actions suspectes

### Détection de Triche
- Speed hacking: Vérifier distance max par tick
- Damage hacking: Calcul serveur uniquement
- Cooldown bypass: Tracking côté serveur
- Position teleport: Validation de trajectoire

---

## 📈 Plan de Développement

### Phase 1: Analyse & Préparation (Semaine 1)
- [x] Concevoir architecture générale
- [ ] Analyser GoguneeGame (code existant)
- [ ] Choisir stack technique finale
- [ ] Setup environnement dev

### Phase 2: Prototype Minimal (Semaine 2-3)
- [ ] Setup VPS + Socket.io
- [ ] Client simple: 1 joueur + déplacement
- [ ] Boss basique avec HP
- [ ] Attaques simples (auto-attack)
- [ ] Calcul de dégâts serveur

### Phase 3: Multiplayer Core (Semaine 4-5)
- [ ] Matchmaking simple
- [ ] 2-6 joueurs simultanés
- [ ] Synchronisation positions
- [ ] Collision joueur-boss

### Phase 4: Mécaniques de Combat (Semaine 6-8)
- [ ] Skills & Ultimes (3 hunters minimum)
- [ ] Boss patterns (lasers, AoE)
- [ ] Phases de break
- [ ] Potions & ressources

### Phase 5: Systèmes Avancés (Semaine 9-10)
- [ ] Système de buffs/debuffs
- [ ] Synergies d'équipe
- [ ] DPS meter temps réel
- [ ] Leaderboard

### Phase 6: Polish & Intégration (Semaine 11-12)
- [ ] UI/UX raffiné
- [ ] Sound effects & music
- [ ] Optimisation performance
- [ ] Intégration BuilderBeru
- [ ] Tests & debug

---

## 🔗 Intégration avec BuilderBeru

### Option A: Route Intégrée
Ajouter dans `src/main.jsx`:
```jsx
<Route path="/raid-battle" element={<RaidBattleLauncher />} />
```

Le composant charge le jeu:
- Via iframe vers domaine séparé
- Ou bundle direct si petit

### Option B: Lien External
Bouton dans BuilderBeru qui ouvre:
- `https://raid.builderberu.com`
- Nouvel onglet

### Partage de Données
```javascript
// BuilderBeru envoie les stats du hunter sélectionné
const hunterData = {
  name: 'Sung Jinwoo',
  class: 'Shadow Monarch',
  stats: { atk, def, hp },
  artifacts: [...] // pour bonus
};

// Envoi via postMessage (iframe) ou localStorage
window.postMessage({ type: 'HUNTER_DATA', data: hunterData }, '*');
```

---

## 🛠️ Configuration VPS

### Prérequis VPS
```bash
# Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# PostgreSQL
sudo apt install postgresql postgresql-contrib

# Redis
sudo apt install redis-server

# Nginx
sudo apt install nginx

# PM2
sudo npm install -g pm2
```

### Structure Déploiement
```
/var/www/raid-battle/
├── client/          # Build React (servi par Nginx)
└── server/          # Backend Node.js (PM2)
```

### Nginx Config
```nginx
server {
  listen 80;
  server_name raid.builderberu.com;

  # Frontend static
  location / {
    root /var/www/raid-battle/client/dist;
    try_files $uri /index.html;
  }

  # Backend API
  location /api {
    proxy_pass http://localhost:3000;
  }

  # WebSocket
  location /socket.io {
    proxy_pass http://localhost:3000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
  }
}
```

---

## ❓ Questions en Suspens

### Décisions à Prendre
1. **Moteur de rendu**: Canvas natif vs Phaser.js vs PixiJS ?
2. **Nombre de hunters initial**: 3, 5, ou tous ?
3. **Tick rate serveur**: 30Hz ou 60Hz ?
4. **Persistance**: Comptes utilisateurs ou anonymous ?
5. **Monétisation**: Free ou système premium ?

### Informations Nécessaires sur GoguneeGame
- ✅ Moteur de rendu: **Canvas 2D natif** (pas de framework)
- ✅ Architecture réseau: **Socket.io** avec serveur Node.js/Express
- ✅ Code réutilisable: Système de networking, collision basique, gestion des stats
- ⚠️ Performance actuelle: Problèmes avec fichiers >3000 lignes, sync complexe
- ❌ Problèmes rencontrés: Architecture monolithique, bugs de synchronisation, notion d'host à bannir

---

## 🔍 ANALYSE DÉTAILLÉE DE GOGUNEEGAME

### 📊 Statistiques du Projet Existant

```
Structure du projet:
├── server/
│   └── server.js                    (3080 lignes) ⚠️ TROP VOLUMINEUX
├── client/
│   ├── game.html
│   ├── character.html
│   └── js/
│       ├── game.js                  (5158 lignes) ❌ CRITIQUE
│       ├── player.js                (2056 lignes) ⚠️
│       ├── render.js                (2331 lignes) ⚠️
│       ├── enemy.js                 (1990 lignes) ⚠️
│       ├── stats.js                 (1006 lignes)
│       ├── leveling.js              (1329 lignes)
│       ├── blocks.js                (1414 lignes)
│       ├── player-combat.js         (661 lignes)
│       ├── boss-ai.js               (488 lignes)
│       ├── classes.js               (369 lignes)
│       └── [12 autres fichiers...]
│
Total: ~25,000 lignes de code
Fichiers: 21 modules client + 1 serveur monolithique
```

### ✅ POINTS FORTS (À Conserver)

#### 1. Système de Stats RPG Solide
```javascript
// stats.js - Bien architecturé
class PlayerStats {
  constructor(level = 1) {
    this.baseStats = { hp, atk, def, vit, mana };
    this.bonusStats = { ... };
    this.buffs = [];
  }

  calculateDerivedStats() {
    // Formules de scaling équilibrées
    this.maxHp = baseStats.hp * (1 + (level-1) * 0.10);
    this.atk = baseStats.atk * (1 + (level-1) * 0.03);
  }
}
```
**✅ Réutilisable**: Système de buffs/debuffs, formules de scaling, gestion des stats dérivées

#### 2. Système de Classes (Warrior/Priest/Archer)
```javascript
// classes.js - Bonne séparation des rôles
CLASSES = {
  warrior: { skill: "Cri de Guerre", bonuses: { hp: +30%, def: +20% } },
  priest: { skill: "Lumière Divine", bonuses: { mana: +30%, regen: +5/s } },
  archer: { skill: "Pluie de Flèches", bonuses: { atk: +20%, fireRate: x1.5 } }
}
```
**✅ Réutilisable**: Concept de synergies d'équipe, buffs de zone, cooldowns de compétences

#### 3. Synchronisation Socket.io (Architecture)
```javascript
// Événements bien définis
'attack-enemy'        → Client attaque
'enemy-damaged'       → Serveur broadcast dégâts
'player-move'         → Sync position (throttle 50ms)
'enemies-full-sync'   → Sync complète des ennemis
```
**✅ Réutilisable**: Throttling réseau, système d'événements, broadcast sélectif

#### 4. Système de Portails/Boss
```javascript
// Boss fights avec phases
elNino: { health: 30000, specialAttacks: ['acorn_storm', 'nut_explosion'] }
kaisel: { health: 1000000, phases: 3, ai: 'kaiselBoss' }
```
**✅ Réutilisable**: Mécanique de boss à phases, attaques spéciales scriptées

---

### ❌ DÉFAUTS MAJEURS (À NE PAS Reproduire)

#### 🔴 CRITIQUE 1: Fichiers Monolithiques

**Problème:**
- `game.js`: **5158 lignes** dans un seul fichier
- `server.js`: **3080 lignes** (limite Claude: 25k tokens dépassée)
- Impossible à maintenir, debugger ou refactor

**Impact:**
```
❌ Temps de chargement élevé
❌ Merge conflicts constants
❌ Difficile à tester unitairement
❌ Code spaghetti avec dépendances circulaires
```

**Solution pour Raid Battle:**
```
✅ Modulariser dès le départ (max 500 lignes/fichier)
✅ Séparer: Entities / Systems / Networking / Rendering
✅ Utiliser ES6 modules ou TypeScript
```

---

#### 🔴 CRITIQUE 2: Notion d'Host Client-Side

**Problème:**
```javascript
// ❌ MAUVAIS - game.js ligne 14
let isGameHost = true;
let isHostPlayer = false;

// Certains calculs uniquement par l'host
if (isGameHost) {
  updateEnemies(); // ❌ Seul l'host calcule les ennemis
}
```

**Impact:**
```
❌ Incohérences entre joueurs (bugs de sync)
❌ Triche possible (manipulation client)
❌ Lag pour non-hosts
❌ Architecture fragile (déconnexion host = crash)
```

**Solution pour Raid Battle:**
```javascript
// ✅ BON - Serveur autoritatif à 100%
// CLIENT: Envoie uniquement les inputs
socket.emit('player:input', { move, skill });

// SERVEUR: Calcule TOUT
room.updateBoss();
room.updatePlayers();
room.broadcastState();
```

---

#### 🟠 IMPORTANT 3: Synchronisation Complexe et Buggée

**Problème:**
```javascript
// Code actuel: Double système de dégâts
// CLIENT vérifie collision → Envoie 'attack-enemy'
// SERVEUR applique dégâts → Broadcast 'enemy-damaged'
// CLIENT met à jour local → DÉSYNCHRONISATION !

// Bugs connus (CLAUDE.md):
- Joueurs ne prennent pas dégâts aléatoirement
- Invincibilité ne fonctionne pas toujours
- Ennemis respawnent en double (côté serveur ET client)
```

**Impact:**
```
❌ Bugs aléatoires difficiles à reproduire
❌ "J'ai touché mais pas de dégâts !"
❌ Ennemis immortels ou morts-vivants
```

**Solution pour Raid Battle:**
```javascript
// ✅ BON - Client = Dumb Terminal
// CLIENT
socket.emit('player:attack', { targetId, skillId });

// SERVEUR (source de vérité unique)
const damage = calculateDamage(player, boss, skill);
boss.hp -= damage;
io.to(roomId).emit('boss:damage', { bossHp: boss.hp, damage });

// CLIENT (affichage uniquement)
onBossDamage(data) {
  boss.hp = data.bossHp; // Pas de calcul local !
  showDamageNumber(data.damage);
}
```

---

#### 🟠 IMPORTANT 4: Pas de TypeScript

**Problème:**
```javascript
// Pas de typage → Erreurs runtime
function attackEnemy(enemy, damage) {
  // enemy peut être undefined, null, ou mauvais type
  enemy.takeDamage(damage); // ❌ Crash si enemy undefined
}
```

**Impact:**
```
❌ Bugs découverts en production
❌ Refactoring dangereux
❌ Aucune autocomplete IDE
❌ Documentation inexistante
```

**Solution pour Raid Battle:**
```typescript
// ✅ BON - TypeScript dès le départ
interface Boss {
  id: string;
  hp: number;
  maxHp: number;
  position: Vector2;
}

function attackBoss(boss: Boss, damage: number): void {
  // Typage garanti à la compilation
}
```

---

#### 🟡 MOYEN 5: Architecture Réseau Non-Optimisée

**Problème:**
```javascript
// Envoi de TOUT l'état toutes les 50ms
socket.emit('enemies-full-sync', {
  enemies: Array.from(enemies.values()) // ❌ Sérialise TOUS les ennemis
});
```

**Impact:**
```
⚠️ Bandwidth élevé (1-2 MB/s par joueur)
⚠️ Lag avec 6+ joueurs
⚠️ Pas de delta compression
```

**Solution pour Raid Battle:**
```javascript
// ✅ BON - Envoyer uniquement les changements
const updates = entities.filter(e => e.isDirty);
socket.emit('game:delta', {
  tick: currentTick,
  updates: updates.map(e => e.serialize())
});
```

---

### 📚 LEÇONS APPRISES

#### ✅ Ce Qu'on DOIT Faire

1. **Architecture Modulaire**
   ```
   ✅ Max 500 lignes par fichier
   ✅ Séparation claire: Entities / Systems / Utils
   ✅ Dépendances unidirectionnelles
   ```

2. **Serveur 100% Autoritatif**
   ```
   ✅ Client = Input + Rendering uniquement
   ✅ Serveur = Source de vérité absolue
   ✅ Validation serveur de TOUT
   ```

3. **TypeScript Obligatoire**
   ```
   ✅ Types stricts partout
   ✅ Interfaces partagées client/serveur
   ✅ Compilation = 0 erreurs
   ```

4. **Réseau Optimisé**
   ```
   ✅ Delta updates (pas full state)
   ✅ Interpolation client-side
   ✅ Tick rate adaptatif (30Hz base, 60Hz combat)
   ```

5. **Testing Dès le Début**
   ```
   ✅ Unit tests (Jest)
   ✅ Integration tests (Socket.io)
   ✅ Load tests (Artillery)
   ```

---

#### ❌ Ce Qu'on NE DOIT PAS Faire

```
❌ Fichiers >1000 lignes
❌ Logique de jeu côté client
❌ JavaScript vanilla (utiliser TypeScript)
❌ Pas de tests
❌ "On refactorera plus tard" (spoiler: non)
❌ Notion d'host/non-host
❌ Calculs critiques en client
❌ Synchronisation bidirectionnelle complexe
```

---

### 🔧 COMPOSANTS RÉUTILISABLES

#### ✅ Peut Être Adapté

1. **Système de Stats** (`stats.js`)
   - Formules de scaling
   - Système de buffs/debuffs
   - Calcul de stats dérivées

2. **Système de Classes** (`classes.js`)
   - Concept de rôles (Tank/DPS/Support)
   - Compétences avec cooldowns
   - Synergies d'équipe

3. **Boss AI Basique** (`boss-ai.js`)
   - Patterns scriptés
   - Système de phases
   - Attaques spéciales

4. **Particules** (`utils.js`)
   - Système de particules simple
   - Effets visuels de feedback

#### ❌ À Réécrire Complètement

1. **Système de Réseau** (`game.js` + `server.js`)
   - Architecture trop complexe
   - Bugs de synchronisation
   - Notion d'host à bannir

2. **Gestion des Ennemis** (`enemy.js`)
   - Spawn client-side ET server-side (conflit)
   - État dupliqué (syncedEnemies vs serverEnemies)

3. **Rendu** (`render.js`)
   - Pas optimisé (pas de culling avancé)
   - Mélange logique/rendu
   - Pas de scene graph

---

### 📈 RECOMMANDATIONS POUR RAID BATTLE

#### Architecture Cible

```typescript
// ✅ PROPRE ET MODULAIRE

// 📁 shared/types/
interface Player {
  id: string;
  position: Vector2;
  hp: number;
  class: HunterClass;
}

// 📁 server/game/
class GameRoom {
  private players: Map<string, Player>;
  private boss: Boss;

  update(deltaTime: number): void {
    this.boss.update(deltaTime);
    this.checkCollisions();
    this.broadcastState();
  }
}

// 📁 client/game/
class GameClient {
  private renderer: Renderer;
  private networkManager: NetworkManager;

  onServerUpdate(state: GameState): void {
    this.interpolateEntities(state);
    this.renderer.render();
  }
}
```

#### Stack Recommandée

```
Backend:
✅ TypeScript + Node.js
✅ Express (API) + Socket.io (WebSocket)
✅ PostgreSQL (classements) + Redis (sessions)
✅ Jest (tests) + Artillery (load tests)

Frontend:
✅ TypeScript + React 19
✅ Phaser 3 (moteur de jeu)
✅ Socket.io-client
✅ Zustand (state management)
✅ Vite (bundler rapide)

DevOps:
✅ Docker (containerisation)
✅ Nginx (reverse proxy)
✅ PM2 (process manager)
✅ GitHub Actions (CI/CD)
```

---

### 🎯 Métriques de Qualité Cibles

```yaml
Code Quality:
  - Max file size: 500 lignes
  - Max function length: 50 lignes
  - Test coverage: >80%
  - TypeScript strict: true
  - ESLint errors: 0

Performance:
  - Server tick rate: 60 Hz
  - Client FPS: 60 stable
  - Network latency: <100ms
  - Bandwidth/player: <100 KB/s
  - Room capacity: 6 joueurs

Stability:
  - Uptime: >99%
  - Crash rate: <0.1%
  - Sync errors: <1%
  - Memory leaks: 0
```

---

## 📝 Prochaines Étapes Immédiates

1. **✅ Analyser GoguneeGame** (TERMINÉ)
   - ✅ Comprendre le code existant
   - ✅ Identifier composants réutilisables
   - ✅ Évaluer qualité et maintenabilité

2. **✅ Décider Stack Finale** (RECOMMANDATIONS CI-DESSOUS)
   - ✅ Moteur de rendu: **Phaser 3** (game engine complet)
   - ✅ Architecture: **Serveur 100% autoritatif**
   - ✅ Langage: **TypeScript strict** (client + serveur)
   - ✅ Tests: **Jest + Artillery**

3. **Setup Initial** (PHASE 1 - Semaine 1)
   - [ ] Créer nouveau dossier `solo-leveling-raid/`
   - [ ] Initialiser monorepo avec pnpm workspaces
   - [ ] Setup TypeScript + ESLint + Prettier
   - [ ] Créer structure modulaire (voir ci-dessous)
   - [ ] Setup Git + .gitignore

4. **Premier Prototype** (PHASE 2 - Semaine 2)
   - [ ] Serveur Socket.io basique (TypeScript)
   - [ ] Client Phaser 3 avec 1 joueur qui bouge
   - [ ] Boss statique avec barre de vie
   - [ ] Connexion temps réel fonctionnelle
   - [ ] Tests manuels en local

---

## 📚 Ressources Utiles

### Tutoriels Multiplayer Game
- [Real-Time Multiplayer in HTML5](https://buildnewgames.com/real-time-multiplayer/)
- [Fast-Paced Multiplayer](https://www.gabrielgambetta.com/client-server-game-architecture.html)
- [Socket.io Game Tutorial](https://socket.io/get-started/chat)

### Phaser.js
- [Official Docs](https://phaser.io/docs)
- [Examples](https://phaser.io/examples)

### Netcode
- [Gaffer on Games - Networked Physics](https://gafferongames.com/)
- [Source Multiplayer Networking](https://developer.valvesoftware.com/wiki/Source_Multiplayer_Networking)

---

## 🎯 Objectifs de Performance

- **Latency**: < 100ms server response
- **FPS Client**: 60 FPS stable
- **Tick Rate**: 30-60 Hz
- **Max Players/Room**: 6
- **Concurrent Rooms**: 100+ (à scaler)
- **Database Queries**: < 50ms

---

## 💡 Notes & Idées Additionnelles

### Idées de Gameplay
- **Boss Variants**: Différents boss avec patterns uniques
- **Difficulté**: Normal / Hard / Nightmare
- **Events**: Boss spéciaux pendant événements
- **Achievements**: Badges pour performances exceptionnelles
- **Guild Raids**: Guildes qui s'affrontent

### Monétisation Potentielle (optionnel)
- Cosmetics (skins hunters)
- Battle Pass saisonnier
- Premium: Plus de raids/jour
- Donations/Tips

---

## 📞 Contact & Collaboration

**Développeur Principal**: (À remplir)
**Repository Git**: (À créer)
**VPS**: (IP/domaine à configurer)

---

---

## 🚀 GUIDE DE DÉMARRAGE: Créer le Projet from Scratch

### Phase 0: Préparation Environnement

```bash
# Vérifier les versions installées
node --version   # v18+ requis
npm --version    # v9+ requis
git --version

# Installer pnpm (package manager rapide)
npm install -g pnpm

# Installer TypeScript globalement
npm install -g typescript

# Vérifier PostgreSQL (pour plus tard)
psql --version
```

---

### Phase 1: Initialiser le Monorepo

```bash
# 1. Créer le dossier principal
mkdir solo-leveling-raid
cd solo-leveling-raid

# 2. Initialiser Git
git init
echo "node_modules/
dist/
.env
*.log
.DS_Store" > .gitignore

# 3. Créer package.json root (monorepo)
pnpm init

# 4. Configurer pnpm workspaces
cat > pnpm-workspace.yaml << EOF
packages:
  - 'packages/*'
  - 'apps/*'
EOF

# 5. Créer structure de dossiers
mkdir -p apps/client apps/server packages/shared
```

---

### Phase 2: Setup TypeScript & Config

```bash
# 1. Créer tsconfig.json root
cat > tsconfig.json << EOF
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "lib": ["ES2020", "DOM"],
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "moduleResolution": "node",
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  }
}
EOF

# 2. Installer dépendances dev communes
pnpm add -D -w typescript @types/node eslint prettier
pnpm add -D -w @typescript-eslint/parser @typescript-eslint/eslint-plugin

# 3. ESLint config
cat > .eslintrc.json << EOF
{
  "parser": "@typescript-eslint/parser",
  "plugins": ["@typescript-eslint"],
  "extends": [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended"
  ],
  "rules": {
    "max-lines": ["error", 500],
    "max-lines-per-function": ["error", 50],
    "@typescript-eslint/no-unused-vars": "error",
    "@typescript-eslint/explicit-function-return-type": "warn"
  }
}
EOF

# 4. Prettier config
cat > .prettierrc << EOF
{
  "semi": true,
  "singleQuote": true,
  "tabWidth": 2,
  "printWidth": 80
}
EOF
```

---

### Phase 3: Setup Serveur (apps/server)

```bash
cd apps/server

# 1. Initialiser package.json
pnpm init

# 2. Installer dépendances
pnpm add express socket.io cors
pnpm add -D @types/express @types/node nodemon ts-node

# 3. Créer structure
mkdir -p src/{game,networking,database,utils}
mkdir -p src/game/{entities,systems,ai}

# 4. Créer tsconfig.json serveur
cat > tsconfig.json << EOF
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src",
    "module": "CommonJS"
  },
  "include": ["src/**/*"],
  "references": [
    { "path": "../../packages/shared" }
  ]
}
EOF

# 5. Scripts package.json
cat > package.json << EOF
{
  "name": "@raid-battle/server",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "nodemon --exec ts-node src/server.ts",
    "build": "tsc",
    "start": "node dist/server.js",
    "lint": "eslint src --ext .ts",
    "test": "jest"
  },
  "dependencies": {
    "express": "^4.18.2",
    "socket.io": "^4.6.1",
    "cors": "^2.8.5"
  },
  "devDependencies": {
    "@types/express": "^4.17.17",
    "@types/node": "^20.10.0",
    "nodemon": "^3.0.2",
    "ts-node": "^10.9.2"
  }
}
EOF

# 6. Créer fichier serveur de base
cat > src/server.ts << 'EOF'
import express from 'express';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';

const app = express();
const server = http.createServer(app);
const io = new SocketIOServer(server, {
  cors: { origin: '*' }
});

const PORT = process.env.PORT || 3000;

// Routes
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

// Socket.io
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
EOF

cd ../..
```

---

### Phase 4: Setup Client (apps/client)

```bash
cd apps/client

# 1. Créer app React + Vite + TypeScript
pnpm create vite . --template react-ts

# 2. Installer dépendances
pnpm install
pnpm add phaser socket.io-client zustand
pnpm add -D @types/node

# 3. Créer structure
mkdir -p src/{game,ui,networking,utils}
mkdir -p src/game/{entities,systems,scenes}

# 4. Modifier vite.config.ts
cat > vite.config.ts << 'EOF'
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/socket.io': {
        target: 'http://localhost:3000',
        ws: true
      }
    }
  }
});
EOF

cd ../..
```

---

### Phase 5: Setup Shared Package (packages/shared)

```bash
cd packages/shared

# 1. Initialiser package.json
pnpm init

# 2. Créer structure
mkdir -p src/{types,constants,utils}

# 3. tsconfig.json
cat > tsconfig.json << EOF
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src",
    "composite": true
  },
  "include": ["src/**/*"]
}
EOF

# 4. Types de base
cat > src/types/index.ts << 'EOF'
export interface Vector2 {
  x: number;
  y: number;
}

export interface Player {
  id: string;
  name: string;
  position: Vector2;
  hp: number;
  maxHp: number;
  class: HunterClass;
}

export enum HunterClass {
  WARRIOR = 'warrior',
  MAGE = 'mage',
  ASSASSIN = 'assassin'
}

export interface Boss {
  id: string;
  position: Vector2;
  hp: number;
  maxHp: number;
  phase: number;
}

export interface GameState {
  tick: number;
  players: Player[];
  boss: Boss;
  projectiles: any[];
}
EOF

# 5. Constants
cat > src/constants/game.ts << 'EOF'
export const GAME_CONFIG = {
  TICK_RATE: 60,
  MAX_PLAYERS: 6,
  RAID_DURATION: 180, // 3 minutes
  BOSS_BASE_HP: 100000
} as const;
EOF

cd ../..
```

---

### Phase 6: Structure Finale Complète

```
solo-leveling-raid/
├── package.json                    # Monorepo root
├── pnpm-workspace.yaml            # Workspaces config
├── tsconfig.json                  # TS config root
├── .eslintrc.json                 # ESLint config
├── .prettierrc                    # Prettier config
├── .gitignore
│
├── apps/
│   ├── server/                    # Backend Node.js
│   │   ├── src/
│   │   │   ├── server.ts          # Entry point
│   │   │   ├── game/
│   │   │   │   ├── GameRoom.ts    # ✅ <500 lignes
│   │   │   │   ├── entities/
│   │   │   │   │   ├── Boss.ts
│   │   │   │   │   ├── Player.ts
│   │   │   │   │   └── Projectile.ts
│   │   │   │   ├── systems/
│   │   │   │   │   ├── DamageSystem.ts
│   │   │   │   │   ├── CollisionSystem.ts
│   │   │   │   │   └── PhysicsSystem.ts
│   │   │   │   └── ai/
│   │   │   │       └── BossAI.ts
│   │   │   ├── networking/
│   │   │   │   ├── SocketManager.ts
│   │   │   │   └── events.ts
│   │   │   ├── database/
│   │   │   │   ├── Database.ts
│   │   │   │   └── repositories/
│   │   │   └── utils/
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   └── client/                    # Frontend React + Phaser
│       ├── src/
│       │   ├── main.tsx           # Entry point React
│       │   ├── game/
│       │   │   ├── PhaserGame.tsx # Wrapper React-Phaser
│       │   │   ├── scenes/
│       │   │   │   ├── BattleScene.ts
│       │   │   │   ├── LobbyScene.ts
│       │   │   │   └── UIScene.ts
│       │   │   ├── entities/
│       │   │   │   ├── PlayerSprite.ts
│       │   │   │   ├── BossSprite.ts
│       │   │   │   └── ProjectileSprite.ts
│       │   │   └── systems/
│       │   │       ├── InputSystem.ts
│       │   │       ├── RenderSystem.ts
│       │   │       └── AnimationSystem.ts
│       │   ├── networking/
│       │   │   ├── SocketClient.ts
│       │   │   └── Interpolator.ts
│       │   ├── ui/
│       │   │   ├── components/
│       │   │   │   ├── HUD.tsx
│       │   │   │   ├── DPSMeter.tsx
│       │   │   │   └── Leaderboard.tsx
│       │   │   └── store/
│       │   │       └── gameStore.ts
│       │   └── utils/
│       ├── package.json
│       ├── tsconfig.json
│       └── vite.config.ts
│
└── packages/
    └── shared/                    # Types/Constants partagés
        ├── src/
        │   ├── types/
        │   │   ├── index.ts       # Interfaces partagées
        │   │   ├── Player.ts
        │   │   ├── Boss.ts
        │   │   └── GameState.ts
        │   ├── constants/
        │   │   ├── game.ts
        │   │   └── network.ts
        │   └── utils/
        │       ├── math.ts
        │       └── validators.ts
        ├── package.json
        └── tsconfig.json
```

---

### Phase 7: Premier Test de Connexion

```bash
# Terminal 1: Démarrer le serveur
cd apps/server
pnpm dev

# Terminal 2: Démarrer le client
cd apps/client
pnpm dev

# Ouvrir http://localhost:5173
# Vérifier console: "Client connected: <socket-id>"
```

---

### Phase 8: Premier Commit Git

```bash
# Retour à la racine
cd ../..

# Créer .gitignore complet
cat > .gitignore << EOF
# Dependencies
node_modules/
pnpm-lock.yaml

# Build outputs
dist/
build/
.cache/

# Environment
.env
.env.local
.env.*.local

# Logs
*.log
npm-debug.log*

# OS
.DS_Store
Thumbs.db

# IDE
.vscode/
.idea/
*.swp
*.swo
EOF

# Premier commit
git add .
git commit -m "🎮 Initial setup: Monorepo TypeScript + Phaser + Socket.io

- ✅ Monorepo avec pnpm workspaces
- ✅ TypeScript strict config
- ✅ Server: Express + Socket.io
- ✅ Client: React + Vite + Phaser
- ✅ Shared: Types communs
- ✅ ESLint + Prettier
- ✅ Max 500 lignes/fichier enforced"

# Créer repository GitHub
# gh repo create solo-leveling-raid --private --source=. --push
```

---

## 📋 CHECKLIST FINALE AVANT DE COMMENCER

### Environnement
- [ ] Node.js v18+ installé
- [ ] pnpm installé globalement
- [ ] Git configuré
- [ ] PostgreSQL installé (pour plus tard)
- [ ] Redis installé (pour plus tard)
- [ ] VS Code + Extensions (ESLint, Prettier, TypeScript)

### Décisions Techniques Validées
- [ ] ✅ Moteur: **Phaser 3**
- [ ] ✅ Langage: **TypeScript strict**
- [ ] ✅ Architecture: **Serveur autoritatif 100%**
- [ ] ✅ Package manager: **pnpm**
- [ ] ✅ Bundler: **Vite**
- [ ] ✅ State management: **Zustand**

### Règles d'Or
- [ ] ✅ **Aucun fichier >500 lignes**
- [ ] ✅ **Serveur calcule TOUT**
- [ ] ✅ **Client = Input + Rendu uniquement**
- [ ] ✅ **Tests dès le début**
- [ ] ✅ **Commits réguliers**

---

## 🎯 OBJECTIF SEMAINE 1

```
✅ Monorepo initialisé
✅ TypeScript configuré
✅ Serveur Socket.io fonctionnel
✅ Client Phaser qui se connecte
✅ 1 joueur qui bouge (WASD)
✅ Position synchronisée serveur→client
✅ Tests manuels réussis
✅ Premier commit Git
```

---

*Document créé le 2025-10-31*
*Dernière mise à jour: 2025-10-31 après analyse complète de GoguneeGame*
*Prochaine étape: Créer le dossier `solo-leveling-raid/` et suivre le guide Phase par Phase*

# BeruRaid - Roadmap de développement

## ✅ Fait (Actuellement)

- [x] Système de combat de base (mouvement ZQSD)
- [x] Système de stats complet (HP, Atk, Def, Mana, Def Pen, Crit, etc.)
- [x] Système de leveling avec points de stats
- [x] Attaques mêlée (clic gauche) et distance (clic droit)
- [x] Boss avec 3 types d'attaques (laser, AOE, expanding circle)
- [x] UI React overlay (barres HP/Mana, skills, stats panel)
- [x] Boss sprite intégré (ant boss)
- [x] Système d'esquive (Space)
- [x] Skills joueur (A: Fireball, E: Explosion AOE)
- [x] Calculs de dégâts avec formules (crit, def pen, etc.)
- [x] Collisions joueur/boss + projectiles/boss

---

## 🎯 Phase 1 - Features Gameplay de Base

### 1. Décor / Background ⭐ Priorité Haute - Facile
- [ ] Charger image de background dans `GameScene.preload()`
- [ ] Afficher background avec parallax (optionnel)
- [ ] Ajouter particules/ambiance (optionnel)

### 2. Phases du Boss ⭐⭐ Priorité Haute - Moyen
- [ ] Détecter % HP du boss (100-75%, 75-50%, 50-25%, <25%)
- [ ] Phase 1 (100-75%): Pattern actuel
- [ ] Phase 2 (75-50%): Augmenter vitesse + spawner plus d'AOE
- [ ] Phase 3 (50-25%): Nouveaux patterns (laser rotatif?)
- [ ] Phase 4 (<25%): Berserk mode (vitesse max, tous les patterns)
- [ ] Transition visuelle entre phases (flash, changement couleur)
- [ ] UI: Indicateur de phase actuelle

### 3. Système de Classes (Hunters) ⭐⭐⭐ Priorité Haute - Complexe

#### 3.1 Architecture de base
- [ ] Créer interface `HunterClass` avec:
  - `className: string`
  - `baseStats: Stats`
  - `skills: Skill[]`
  - `passive: PassiveAbility`
  - `sprite: string`
  - `description: string`

#### 3.2 Classes à implémenter
- [ ] **Tank** (Protecteur)
  - Stats: High HP (200), High Def (15), Low Atk (8)
  - Skill 1: Taunt (attire aggro boss 5sec)
  - Skill 2: Protection Aura (réduit dégâts alliés proches de 30%)
  - Passive: Regen 2% HP/sec

- [ ] **DPS Mêlée** (Assassin)
  - Stats: Medium HP (120), High Atk (18), Low Def (5)
  - Skill 1: Dash Attack (téléporte + dégâts)
  - Skill 2: Execute (bonus dégâts si boss <30% HP)
  - Passive: +20% crit rate

- [ ] **DPS Distance** (Archer)
  - Stats: Low HP (100), High Atk (15), Medium Def (8)
  - Skill 1: Multi-shot (3 projectiles en éventail)
  - Skill 2: Poison Arrow (DOT 5sec)
  - Passive: +30% attack speed

- [ ] **DPS Magie** (Mage)
  - Stats: Low HP (90), Very High Atk (20), Low Def (3)
  - Skill 1: Fireball (gros projectile lent)
  - Skill 2: Meteor (AOE massif, long cast)
  - Passive: Mana regen +50%

- [ ] **Healer** (Prêtre)
  - Stats: Medium HP (110), Low Atk (5), Medium Def (10)
  - Skill 1: Heal (soigne allié ou soi-même)
  - Skill 2: Regeneration Aura (HoT zone)
  - Passive: +20% healing effectivness

- [ ] **Support** (Barde)
  - Stats: Medium HP (100), Low Atk (8), Medium Def (8)
  - Skill 1: Attack Buff (+30% Atk alliés 10sec)
  - Skill 2: Slow Debuff (boss -40% vitesse 5sec)
  - Passive: Cooldown -15% pour alliés proches

#### 3.3 Écran de sélection
- [ ] Créer `HunterSelectionScene`
- [ ] UI avec grille de 6 hunters
- [ ] Preview: portrait + nom + description + stats
- [ ] Bouton "Confirmer" → lancer `GameScene` avec classe choisie
- [ ] Animations de hover/selection

#### 3.4 Intégration dans le jeu
- [ ] Modifier `Player.ts` pour accepter `hunterClass: HunterClass`
- [ ] Appliquer stats de base selon la classe
- [ ] Remplacer skills A/E par skills de la classe
- [ ] Changer sprite du joueur selon la classe

---

## 🔥 Phase 2 - Système de Buffs & Synergies

### 4. Buffs/Debuffs ⭐⭐ Priorité Moyenne - Complexe
- [ ] Créer système de `StatusEffect`:
  - `type: 'buff' | 'debuff' | 'dot' | 'hot'`
  - `duration: number`
  - `stackable: boolean`
  - `effect: (target) => void`
- [ ] Buffs à implémenter:
  - [ ] Attack Buff (+% attack)
  - [ ] Defense Buff (+% defense)
  - [ ] Speed Buff (+% movement speed)
  - [ ] Attack Speed Buff
- [ ] Debuffs à implémenter:
  - [ ] Slow (-% speed)
  - [ ] Armor Break (-% defense)
  - [ ] Poison (DOT)
  - [ ] Stun (immobilise)
- [ ] UI: Afficher icônes des buffs/debuffs actifs
- [ ] Update loop pour gérer durées/ticks

### 5. Système d'Auras (Radius Detection) ⭐⭐ Priorité Moyenne - Moyen
- [ ] Créer classe `Aura`:
  - `radius: number`
  - `effect: StatusEffect`
  - `targets: 'allies' | 'enemies' | 'all'`
- [ ] Détection d'entités dans le radius (Phaser overlap)
- [ ] Appliquer effets aux cibles dans l'aura
- [ ] Visuel: cercle semi-transparent autour du joueur
- [ ] Gestion du stacking (auras multiples)

### 6. Synergies entre Classes ⭐ Priorité Basse - Moyen
- [ ] Définir combos (ex: Tank Taunt + DPS = +20% dmg)
- [ ] Système de détection de composition d'équipe
- [ ] Bonus de synergie activés automatiquement
- [ ] UI: Notification "Synergie activée!"
- [ ] Exemples:
  - Tank + Healer = Tank gains +50% HP regen
  - Support + DPS = All DPS +15% crit rate
  - 2+ Mages = Spell damage +25%

---

## 💾 Phase 3 - Persistance & Progression

### 7. Base de Données ⭐⭐⭐ Priorité Haute - Complexe

#### 7.1 Architecture BDD
- [ ] Choisir stack: **PostgreSQL** (recommandé) ou MongoDB
- [ ] ORM: **Prisma** (TypeScript-first)
- [ ] Structure:
  ```
  Users
  ├── id (UUID)
  ├── username
  ├── email
  ├── password (hashed)
  ├── createdAt
  └── updatedAt

  Characters
  ├── id
  ├── userId (FK)
  ├── hunterClass
  ├── level
  ├── experience
  ├── statPoints
  ├── stats (JSON: {hp, atk, def, ...})
  ├── equippedItems (JSON)
  └── unlockedSkills (JSON)

  ProgressionData
  ├── id
  ├── characterId (FK)
  ├── bossesDefeated (JSON)
  ├── highestDamage
  ├── totalPlaytime
  ├── achievements (JSON)
  └── lastPlayed

  Inventory
  ├── id
  ├── characterId (FK)
  ├── itemId
  ├── quantity
  └── acquiredAt
  ```

#### 7.2 Backend API
- [ ] Setup backend: **Express.js** ou **Fastify**
- [ ] Routes:
  - [ ] `POST /auth/register` - Créer compte
  - [ ] `POST /auth/login` - Login (retourne JWT)
  - [ ] `GET /characters/:userId` - Liste personnages
  - [ ] `POST /characters` - Créer personnage
  - [ ] `PUT /characters/:id/stats` - Sauvegarder stats
  - [ ] `GET /characters/:id/progression` - Récupérer progression
  - [ ] `PUT /characters/:id/progression` - Sauvegarder progression
- [ ] Middleware: JWT authentication
- [ ] Validation: Zod schemas

#### 7.3 Intégration Client
- [ ] Setup client HTTP: **Axios** ou **fetch wrapper**
- [ ] Auto-save toutes les 30 secondes
- [ ] Save on logout/quit
- [ ] Load character data on game start
- [ ] Gestion des erreurs réseau (retry, offline mode)

### 8. Système de Progression ⭐⭐ Priorité Moyenne - Moyen
- [ ] XP curve (formule exponentielle)
- [ ] Récompenses par level:
  - [ ] +5 stat points
  - [ ] Unlock skill à level 5, 10, 15
  - [ ] Augmentation stats automatique (+2 HP/level)
- [ ] Level cap: 50 (pour l'instant)
- [ ] Prestige system (optionnel - plus tard)

### 9. Achievements ⭐ Priorité Basse - Facile
- [ ] Définir achievements:
  - "First Blood" - Tuer premier boss
  - "Speedrunner" - Tuer boss en <2 min
  - "Tank Master" - Bloquer 10000 dégâts
  - "Glass Cannon" - Tuer boss sans prendre de dégâts
- [ ] UI: Panel achievements avec icons
- [ ] Notifications in-game quand débloqué
- [ ] Récompenses: titres, cosmetics (plus tard)

---

## 🌐 Phase 4 - Multiplayer

### 10. Architecture Réseau ⭐⭐⭐ Priorité Haute - Très Complexe

#### 10.1 Backend WebSocket ✅ DONE
- [x] Setup **Socket.io** server
- [x] Room system (1 room = 1 raid instance)
- [x] Gestion des connexions/déconnexions
- [x] Authoritative server:
  - [x] Server calcule positions/dégâts/collisions
  - [x] Clients envoient inputs seulement
  - [x] Server broadcast états à tous les clients (60 FPS)
- [x] Server-side entities: ServerBoss, ServerPlayer
- [x] Game loop 60 FPS dans server.ts
- [x] Boss AI serveur (3 attaques, mouvement, stun, collisions)
- [x] Handlers pour movement, dodge, attack, skill

#### 10.2 Synchronisation ✅ DONE
- [x] Client → Server events:
  - `game:movement` - {up, down, left, right}
  - `game:attack` - {type, targetX, targetY}
  - `game:skill` - {skillId, targetX, targetY}
  - `game:dodge`
- [x] Server → Client events:
  - `game:stateUpdate` - État complet (60 FPS)
  - `room:playerJoined` - Nouveau joueur
  - `room:playerLeft` - Joueur déco
  - `game:completed` - Fin de partie
- [x] Client: Envoyer inputs au serveur
- [x] Client: Render depuis server state
- [x] Mode solo conservé (logique client-side)
- [x] Mode multiplayer (server authoritative)
- [ ] TODO Futur: Interpolation client-side (smooth movement)
- [ ] TODO Futur: Lag compensation (client-side prediction)

**🎉 MULTIPLAYER CORE COMPLET !**

### Ce qui a été implémenté aujourd'hui:

**Serveur (apps/server):**
- ✅ `ServerBoss.ts` - Boss avec AI complète (laser, AOE, expanding circle)
- ✅ `ServerPlayer.ts` - Joueur avec stats, combat, dodge, mana
- ✅ `GameRoom.ts` - Game loop 60 FPS + handlers actions
- ✅ `server.ts` - Game loop global + broadcast state
- ✅ Collision detection serveur (joueurs vs attaques boss)
- ✅ Calcul de dégâts server-side
- ✅ Victory/defeat synchronisé

**Shared (packages/shared):**
- ✅ Types `BossAttack`, `BossState` étendus
- ✅ Events `game:movement`, `game:dodge`, `game:attack`, `game:skill`
- ✅ Event `game:stateUpdate` (60 FPS)

**Client (apps/client):**
- ✅ Mode multiplayer dans `GameScene.ts`
- ✅ Envoi des inputs au serveur
- ✅ Rendu depuis `game:stateUpdate`
- ✅ UI mise à jour depuis server state
- ✅ Message victory/defeat
- ✅ Mode solo conservé (logique actuelle intacte)

#### 10.3 Lobby System
- [ ] Créer `LobbyScene`:
  - Liste des rooms disponibles
  - Créer nouvelle room
  - Rejoindre room (max 4-8 joueurs)
  - Ready check
  - Chat
- [ ] Room settings:
  - Difficulté (Normal, Hard, Hell)
  - Boss sélectionné
  - Niveau requis minimum

#### 10.4 Déploiement VPS
- [ ] Choisir VPS provider (OVH, DigitalOcean, etc.)
- [ ] Setup serveur:
  - Ubuntu Server 22.04
  - Node.js + PM2 (process manager)
  - PostgreSQL
  - Nginx (reverse proxy)
  - SSL/TLS (Let's Encrypt)
- [ ] CI/CD:
  - GitHub Actions
  - Auto-deploy on push to `main`
- [ ] Monitoring:
  - PM2 logs
  - Database backups quotidiens
  - Uptime monitoring (UptimeRobot)

---

## 🎨 Phase 5 - Polish & Content (Futur)

### 11. Graphismes & Animations ⭐ Priorité Basse
- [ ] Sprites animés pour hunters (idle, walk, attack)
- [ ] Particle effects améliorés
- [ ] Skill animations (trails, impacts)
- [ ] UI/UX redesign professionnel
- [ ] Transitions de scènes fluides

### 12. Sons & Musique ⭐ Priorité Basse
- [ ] Background music (combat theme)
- [ ] SFX: attaques, hits, skills
- [ ] Voice lines (optionnel)
- [ ] Audio mixing (volumes ajustables)

### 13. Contenu Additionnel ⭐⭐ Priorité Moyenne
- [ ] Plus de boss (5-10 boss uniques)
- [ ] Système de loot (équipement, armes)
- [ ] Rarités (Common, Rare, Epic, Legendary)
- [ ] Crafting system
- [ ] PvP Arena (plus tard)
- [ ] Modes de jeu:
  - Story Mode
  - Endless Mode
  - Time Attack
  - Boss Rush

### 14. Social Features ⭐ Priorité Basse
- [ ] Friends list
- [ ] Guild/Clan system
- [ ] Leaderboards
- [ ] Replay system
- [ ] Spectator mode

---

## 📋 Priorités Immédiates (Cette Semaine)

### Jour 1-2: Fondations
1. ✅ Décor/Background
2. ✅ Phases du Boss (4 phases)
3. ⏸️ Début système de classes (architecture)

### Jour 3-4: Classes
4. ⏸️ Implémenter 3 classes de base (Tank, DPS, Healer)
5. ⏸️ Écran de sélection basique
6. ⏸️ Skills uniques par classe

### Jour 5-7: BDD & Persistence
7. ⏸️ Setup PostgreSQL + Prisma
8. ⏸️ Backend API (auth + CRUD characters)
9. ⏸️ Auto-save système

---

## 🔧 Stack Technique Recommandée

### Frontend
- **Game Engine**: Phaser 3 ✅
- **Framework**: React 18 + Vite ✅
- **Language**: TypeScript ✅
- **Styling**: CSS Modules / Tailwind
- **State Management**: Zustand (optionnel)

### Backend
- **Runtime**: Node.js 20+
- **Framework**: Fastify (performant) ou Express
- **Database**: PostgreSQL 15
- **ORM**: Prisma
- **WebSocket**: Socket.io
- **Auth**: JWT (jsonwebtoken)
- **Validation**: Zod

### DevOps
- **Version Control**: Git + GitHub
- **CI/CD**: GitHub Actions
- **Hosting**: VPS (Ubuntu) + Docker
- **Reverse Proxy**: Nginx
- **SSL**: Let's Encrypt (Certbot)
- **Process Manager**: PM2
- **Monitoring**: PM2 + Grafana (optionnel)

---

## 📝 Notes Importantes

### Anti-Cheat
- ⚠️ **JAMAIS** faire confiance au client
- Tous les calculs critiques côté serveur:
  - Dégâts
  - Positions (validation)
  - Loot drops
  - XP gains
- Rate limiting sur les actions (anti-spam)

### Performance
- Optimiser sprites (atlases texture)
- Object pooling pour projectiles
- Limiter particules (FPS drops)
- Database indexing (userId, characterId)
- Redis cache (optionnel - sessions, leaderboards)

### Scalabilité
- Horizontal scaling: Multiple game servers
- Load balancer (HAProxy/Nginx)
- Shared database (PostgreSQL cluster)
- Redis pour sessions distribuées

---

**Dernière mise à jour**: 2025-11-02
**Version**: 0.2.0-alpha
**Statut**: En développement actif

Bon courage! 🚀

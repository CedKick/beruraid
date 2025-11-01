# 🎮 BeruRaid - Solo Leveling: Raid Battle

Un jeu de raid boss multijoueur en temps réel inspiré de Solo Leveling: Arise.

## 📋 Vue d'Ensemble

BeruRaid est un jeu coopératif en vue top-down où 2-6 joueurs affrontent un boss géant ensemble. Le twist : ce n'est pas le joueur qui fait le plus de dégâts qui gagne, mais **l'équipe** qui maximise ses dégâts collectifs grâce aux synergies !

### Caractéristiques
- ⚔️ Combat en temps réel avec patterns de boss complexes
- 👥 2-6 joueurs par raid
- ⏱️ 3 minutes par combat
- 🏆 Système de classement basé sur les synergies d'équipe
- 🎭 Multiple chasseurs avec compétences uniques

## 🏗️ Architecture

### Monorepo Structure

```
BeruRaid/
├── apps/
│   ├── client/          # Frontend React + Phaser 3
│   └── server/          # Backend Node.js + Socket.io
└── packages/
    └── shared/          # Types TypeScript partagés
```

### Stack Technique

**Backend**
- Node.js + TypeScript
- Express.js (API REST)
- Socket.io (WebSocket temps réel)

**Frontend**
- React 19
- Phaser 3 (Game Engine)
- Vite (Build tool)
- Socket.io-client

**Shared**
- TypeScript strict mode
- Types communs entre client/serveur

## 🚀 Démarrage

### Prérequis
- Node.js v18+
- pnpm (package manager)

### Installation

```bash
# Installer pnpm globalement
npm install -g pnpm

# Installer les dépendances
pnpm install
```

### Développement

```bash
# Démarrer le serveur et le client en parallèle
pnpm dev

# Ou séparément:
pnpm dev:server  # Serveur sur port 3000
pnpm dev:client  # Client sur port 5173
```

### Build Production

```bash
pnpm build
```

## 📊 Règles d'Architecture

### ✅ Bonnes Pratiques Appliquées

1. **Max 500 lignes par fichier** - Enforced par ESLint
2. **Serveur 100% autoritatif** - Client = Input + Rendu uniquement
3. **TypeScript strict** - Typage fort partout
4. **Architecture modulaire** - Séparation claire des responsabilités
5. **Code review** - Pas de merge sans review

### ❌ À Éviter

- ❌ Fichiers monolithiques (>500 lignes)
- ❌ Logique de jeu côté client
- ❌ Notion d'host/non-host
- ❌ JavaScript vanilla (utiliser TypeScript)

## 🎯 Roadmap

### Phase 1: Prototype Minimal ✅
- [x] Setup monorepo
- [x] Connexion client-serveur
- [x] Architecture de base

### Phase 2: Premier Prototype (En cours)
- [ ] Déplacement joueur (WASD)
- [ ] Boss statique avec HP
- [ ] Attaque de base
- [ ] Synchronisation temps réel

### Phase 3: Multiplayer Core
- [ ] Matchmaking
- [ ] 2-6 joueurs simultanés
- [ ] Collision detection

### Phase 4: Mécaniques de Combat
- [ ] 3 chasseurs de base
- [ ] Skills & Ultimes
- [ ] Boss patterns (lasers, AoE)
- [ ] Phases de break

### Phase 5+
- [ ] Système de buffs/debuffs
- [ ] Synergies d'équipe
- [ ] DPS meter
- [ ] Leaderboard

## 📝 Documentation Complète

Voir [RAID_BATTLE_PROJECT.md](./RAID_BATTLE_PROJECT.md) pour la documentation technique complète.

## 🧑‍💻 Développement

### Structure des Fichiers

Chaque module respecte la limite de 500 lignes :
- `apps/server/src/game/GameRoom.ts` - Gestion des raids (118 lignes)
- `apps/client/src/networking/SocketService.ts` - Socket client (106 lignes)
- `packages/shared/src/types/*.ts` - Types partagés (<100 lignes chacun)

### Commandes Utiles

```bash
# Linter
pnpm lint

# Tests (à venir)
pnpm test

# Build
pnpm build
```

## 🔗 Endpoints

- **Server Health**: http://localhost:3000/health
- **Server Stats**: http://localhost:3000/api/stats
- **Client**: http://localhost:5173

## 📄 License

Privé - Tous droits réservés

---

**Version**: 1.0.0-alpha
**Status**: 🚧 En développement actif

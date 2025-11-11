# Juhee - Healer Mechanics Documentation

## Character Overview
**Juhee** est le personnage healer du jeu. Elle a des mécaniques uniques qui nécessitent un système de projectiles hybride.

## Mécanique de Clic Droit (Right-Click)

### Concept
Le clic droit de Juhee lance un **projectile vert (boule verte)** qui a deux comportements selon la cible:
- **Sur un boss**: Inflige des dégâts
- **Sur un allié**: Soigne l'allié

### État Actuel (Bug)
❌ **PROBLÈME**: Les projectiles ne spawn pas visuellement
- Le clic droit est détecté côté client ✅
- L'event est envoyé au serveur ✅
- Mais aucun projectile n'apparaît ❌
- `renderSkillEffects` est appelé avec 0 effets ❌

### Logs Actuels
```
🖱️ [MOUSE] Right click detected for character: juhee
💚 [MOUSE] Juhee right-click - setting up heal projectile
📡 [MOUSE] Sending right-click to server - target: (x, y)
📡 [RIGHTCLICK] sendRightClickToServer called
✅ [RIGHTCLICK] Emitting game:rightclick event to server
🎨 [CLIENT] renderSkillEffects called with 0 effects ❌ PROBLÈME ICI
```

## Comparaison avec Autres Personnages

### Personnages qui Fonctionnent
Tous les autres personnages ont leur clic droit qui fonctionne correctement:
- Leurs projectiles apparaissent
- Les effets visuels se déclenchent

### Différence de Juhee
Juhee est le **premier healer**, donc:
- Nécessite un système de **ciblage intelligent** (boss vs allié)
- Nécessite **deux types d'effets** (dégâts vs heal)
- Le projectile doit être **vert** (couleur spéciale pour heal)

## Architecture Nécessaire

### Côté Client
1. Détecter le clic droit ✅
2. Envoyer la position cible au serveur ✅
3. **Recevoir l'info du projectile du serveur** ❓
4. **Spawn le projectile vert visuellement** ❌

### Côté Serveur
1. Recevoir le clic droit ❓
2. Déterminer la cible (boss ou allié proche)
3. Créer le projectile avec les bonnes propriétés
4. **Broadcast aux clients** ❓

## Plan de Fix

### À Vérifier
1. [ ] Le serveur reçoit-il l'event `game:rightclick` ?
2. [ ] Le serveur crée-t-il un projectile pour Juhee ?
3. [ ] Le serveur broadcast-il le projectile aux clients ?
4. [ ] Le client reçoit-il les données du projectile ?
5. [ ] Le render du projectile est-il appelé ?

### Système de Ciblage
Pour les futurs healers, implémenter:
- Détection de proximité (rayon autour du clic)
- Priorité: Allié blessé > Boss > Allié pleine vie
- Feedback visuel différent selon la cible

## Notes Techniques

### Couleur Projectile
- Vert (#00ff00 ou similaire) pour effet heal/support

### Comportement Attendu
1. Clic droit → Boule verte spawn à la position de Juhee
2. Boule verte se déplace vers la cible
3. Impact sur boss → dégâts + effet vert
4. Impact sur allié → heal + effet vert scintillant

---

## Solution Implémentée

**Architecture finale** : Utilise le système de projectiles normal (comme les autres personnages)

### Changements
1. Ajout du type `'heal'` aux projectiles dans `Projectile` interface
2. Ajout de `healAmount?: number` pour stocker la valeur de heal
3. Création de `createHealProjectile()` dans ServerPlayer (même pattern que `createRangedAttack()`)
4. Modification de `checkProjectileCollisions()` pour gérer les projectiles heal :
   - Vérifie d'abord collision avec les alliés → heal
   - Sinon vérifie collision avec le boss → damage
5. Rendu côté client avec couleur verte et effet de pulse

### Avantages
- Utilise la même infrastructure que les attaques normales
- Pas de système séparé complexe avec skillEffects
- Automatiquement synchronisé en multiplayer
- Performance optimale (object pooling)

---

**Status**: ✅ Fonctionnel
**Priorité**: Résolue
**Dernière mise à jour**: 2025-11-11

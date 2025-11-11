# Synchronisation des Skills en Multijoueur

## État actuel
- ✅ Projectiles auto-attack (melee & ranged) synchronisés
- ✅ Skills des personnages TOUS synchronisés (Fern, Stark, Guts, Sung, Juhee)
- ✅ Effets visuels en multijoueur fonctionnels pour tous les personnages

## Personnages et leurs skills

### 🔵 FERN (Mage - AOE/Projectile)

#### **Skill A** - Fire AOE (Spammable)
- **Cooldown:** 0.8s
- **Mana:** 5
- **Dégâts base:** 15
- **Mécanisme unique:** Système de stacks
  - Démarre à 1 stack
  - Si lance sans bouger : +1 stack (max 30)
  - Si bouge > 10 pixels : reset à 1 stack
  - Dégâts = base × (1.2)^(stacks-1)
- **Visuel:** Cercle de feu bleu qui s'expand (30→180 radius)
- **Durée:** 800ms
- **Hitbox:** Peut hit une fois toutes les 0.2s

#### **Skill E** - Zoltraak (Laser)
- **Cooldown:** 10s
- **Mana:** 15
- **Dégâts:** 15 × 30 = 450
- **Visuel:** Image 'zoltraak' qui se déplace
- **Vitesse:** 800
- **Durée:** 1.5s
- **Hit:** Une seule fois

---

### 🟡 STARK (Tank - Stun/Shield)

#### **Skill A** - Stun AOE
- **Cooldown:** 15s
- **Mana:** 10
- **Range:** 120 (melee)
- **Dégâts:** 50
- **Effet:** Stun boss 2s
- **Condition:** Boss doit être dans le range
- **Visuel:** Shockwave orange-rouge + lignes d'impact
- **Durée:** 500ms

#### **Skill E** - Damage Shield
- **Cooldown:** 30s
- **Mana:** 20
- **Durée:** 4s
- **Effet:** Réduit dégâts reçus de 90%
- **Visuel:** Bouclier bleu qui pulse autour du joueur

#### **Passif** - 5x damage pendant stun
- Quand Stark attaque un boss stunné : dégâts ×5

---

### 🔴 GUTS (Berserker - HP Cost/Invincibility)

#### **Skill A** - Berserker Rage
- **Cooldown:** 0.5s
- **Coût:** 20% HP actuel
- **Dégâts:** 40
- **Condition:** HP > 21% (ou invincible = pas de coût)
- **Visuel:** Cercle rouge sombre qui s'expand (40→120)
- **Durée:** 600ms

#### **Skill B** - Beast of Darkness
- **Cooldown:** 10s
- **Mana:** 30
- **Durée:** 5s invincibilité
- **Effet:** 50% chance de stun boss 5s
- **Visuel:** Aura sombre violette qui pulse
- **Pendant invincibilité:** Skill A ne coûte pas de HP

#### **Ultimate (R)** - Berserker Armor
- **Cooldown:** 45s
- **Mana:** 50
- **Durée:** 10s
- **Effet initial:** Burst de 500% attack
- **Effet continu:** DPS multiplier qui augmente de ×1.2 toutes les 0.5s
- **Visuel:**
  - Écran noir + image 'guts_ulti'
  - Shake camera
  - Flash rouge
  - Particules de sang
- **Durée cinématique:** 1s

---

### 🟣 SUNG (DPS - Stacks/Gamble)

#### **Skill A** - Barrage Strike (AOE + Crit Stacks)
- **Cooldown:** 1s
- **Mana:** 7
- **Dégâts:** 200% de l'attaque de base
- **Mécanisme:**
  - Donne un buff de crit (+15% crit rate par stack)
  - Max 10 stacks
  - Durée du buff: 20s
  - 33% chance de slow le boss
- **Visuel:** AOE violet/pourpre autour du joueur (radius 80)
- **Durée:** 300ms

#### **Skill E** - Death Gamble (Buff Aléatoire)
- **Cooldown:** 12s
- **Mana:** 19
- **Durée:** 5s
- **Effet:** Cercle qui suit le joueur
  - 🔵 **Cercle Bleu (50%):** +25% ATK, +25% DEF, +25% ATK Speed
  - 🔴 **Cercle Rouge (50%):** +50% ATK, -25% DEF, -25% ATK Speed (high risk/reward)
- **Visuel:** Cercle bleu ou rouge qui pulse autour du joueur

#### **Passif** - Desperate Resolve
- **Cooldown:** 15s (après activation)
- **Condition:** HP < 30%
- **Effet:** +50% ATK pendant un certain temps
- **Note:** Peut ressusciter si Juhee le heal dans les 5s après la mort

---

### 💚 JUHEE (Support - Heal/Buffs)

#### **Skill A** - Healing Circle
- **Cooldown:** 10s
- **Mana:** 15
- **Range:** 120 (AOE)
- **Heal:** 50-80 (random) × (1 + maxHP/1000)
- **Mécanisme unique:** 10% chance de PANIC!
  - 🧊 **Freeze (50%):** Joueur gelé pendant 3s
  - 🔄 **Reverse (50%):** Contrôles inversés pendant 3s
  - Panic ne peut arriver que toutes les 3s
- **Visuel:** Cercle vert avec sparkles et waves
- **Durée:** 500ms + animations

#### **Skill E** - Blessing of Courage (Buff Zone)
- **Cooldown:** 15s
- **Mana:** 30
- **Range:** 150
- **Durée buff:** 15s
- **Effet (à tous les alliés dans la zone):**
  - +100% ATK
  - +50% DEF
  - +30% ATK Speed
- **Mécanisme unique:** 10% chance de PANIC (même que Skill A)
- **Visuel:** Cercle doré avec rayons radiants
- **Durée visuelle:** 500ms

#### **Right-Click** - Heal Projectile
- **Cooldown:** 1s
- **Mana:** 0 (gratuit!)
- **Dégâts/Heal:** 30 × (1 + maxHP/1000)
- **Mécanisme:**
  - Heal les alliés touchés
  - Damage le boss si touché
- **Visuel:** Projectile vert qui se déplace
- **Vitesse:** 400 pixels/s
- **Durée max:** 5s (auto-destroy)

#### **Passif** - Résurrection de Sung
- Si Sung meurt, Juhee a 5 secondes pour le heal et le ressusciter

---

### ⚪ FRIEREN
**TODO:** Pas encore de skills implémentés

---

## Architecture de synchronisation

### Phase 1 : Server-side skill handling

#### Ajout au ServerPlayer
```typescript
// Dans ServerPlayer.ts
- Stocker les skills actifs (buffs/debuffs)
- Gérer les cooldowns
- Gérer les effets de zone (AOE)
- Calculer les dégâts avec les buffs
```

#### Ajout au GameRoom
```typescript
// Dans GameRoom.ts
- Recevoir les événements skill du client
- Valider le skill (cooldown, mana, conditions)
- Créer les effets de skill
- Check collisions skill-boss
- Synchroniser les effets actifs
```

#### Ajout au GameState (shared)
```typescript
interface SkillEffect {
  id: string;
  type: 'fern_fire' | 'fern_zoltraak' | 'stark_stun' | 'guts_rage' | etc;
  ownerId: string;
  x: number;
  y: number;
  radius?: number;
  angle?: number;
  createdAt: number;
  expiresAt: number;
  data?: any; // Pour données spécifiques (stacks Fern, etc.)
}

interface PlayerBuff {
  type: 'stark_shield' | 'guts_invincible' | 'guts_ulti';
  expiresAt: number;
  data?: any; // Shield reduction, ulti multiplier, etc.
}

GameState {
  ...
  skillEffects: SkillEffect[];
  playerBuffs: Map<string, PlayerBuff[]>;
}
```

### Phase 2 : Client rendering

```typescript
// Dans GameScene.ts
- Recevoir skillEffects du server state
- Créer/détruire les visuels selon le type
- Afficher les buffs du joueur (shield, invincibility, etc.)
```

### Émission des skills
```typescript
// Client émet :
socket.emit('game:skill', {
  skillId: 1, // ou 2, ou 3 (ultimate)
  targetX?: number,
  targetY?: number,
  mouseX?: number,
  mouseY?: number
});
```

---

## Plan d'implémentation

### ✅ Étape 1 : Infrastructure (COMPLÉTÉ)
1. ✅ Ajouter `SkillEffect` et `PlayerBuff` aux types shared
2. ✅ Modifier `GameState` pour inclure `skillEffects` et `playerBuffs`
3. ✅ Ajouter méthode `handlePlayerSkill()` dans `GameRoom`

### ✅ Étape 2 : Stark (COMPLÉTÉ)
1. ✅ Implémenter Skill A (Stun AOE) avec visuels améliorés
2. ✅ Implémenter Skill E (Shield) avec effet suivant le joueur
3. ✅ Ajouter passif 5x damage quand boss stunné
4. ✅ Tester en multi

### ✅ Étape 3 : Guts (COMPLÉTÉ)
1. ✅ Implémenter Skill A (Rage - HP cost)
2. ✅ Implémenter Skill B (Invincibility) avec aura visuelle
3. ✅ Implémenter Ultimate (Berserker Armor) avec effet fullscreen
4. ✅ Tester en multi

### ✅ Étape 4 : Fern (COMPLÉTÉ)
1. ✅ Implémenter système de stacks
2. ✅ Implémenter Skill A (Fire AOE avec stacks)
3. ✅ Implémenter Skill E (Zoltraak laser)
4. ✅ Tester en multi

### ✅ Étape 5 : Sung (COMPLÉTÉ)
1. ✅ Implémenter Skill A (Barrage Strike + crit stacks)
2. ✅ Implémenter Skill E (Death Gamble) avec cercles bleu/rouge
3. ✅ Implémenter passif Desperate Resolve
4. ✅ Tester en multi

### ✅ Étape 6 : Juhee (COMPLÉTÉ)
1. ✅ Implémenter Skill A (Healing Circle) avec panic chance
2. ✅ Implémenter Skill E (Blessing) avec buffs de zone
3. ✅ Implémenter Right-Click (Heal Projectile)
4. ✅ Implémenter mécanique de résurrection de Sung
5. ✅ Tester en multi

### ❌ Étape 7 : Frieren (PAS ENCORE IMPLÉMENTÉ)
- À définir (pas encore de skills)

---

## Notes importantes

### Gestion des stacks (Fern)
- Les stacks doivent être gérés côté serveur
- Check position avant/après pour reset
- Synchroniser le nombre de stacks dans l'état du joueur

### Gestion des buffs
- Shield de Stark : modifier la réduction de dégâts dans `takeDamage()`
- Invincibilité de Guts : bypass `takeDamage()`
- Ultimate de Guts : modifier le multiplicateur de dégâts

### Synchronisation du stun boss
- Le boss doit avoir un état `isStunned`
- Désactiver l'AI du boss pendant le stun
- Afficher l'icône de stun

### Collisions
- Fern Fire AOE : collision continue pendant expansion
- Zoltraak : collision une seule fois
- Guts Rage : collision continue pendant expansion
- Stark Stun : check de range instantané

---

## État de synchronisation par personnage

| Personnage | Skill A | Skill E | Ultimate/Spécial | Passif | Visuels Multi | Status |
|------------|---------|---------|------------------|--------|---------------|---------|
| **Fern** 🔵 | ✅ Fire AOE | ✅ Zoltraak | - | - | ✅ | **100%** |
| **Stark** 🟡 | ✅ Stun AOE | ✅ Shield | - | ✅ 5x dmg | ✅ | **100%** |
| **Guts** 🔴 | ✅ Rage | ✅ Beast | ✅ Berserker | - | ✅ | **100%** |
| **Sung** 🟣 | ✅ Barrage | ✅ Gamble | - | ✅ Resolve | ✅ | **100%** |
| **Juhee** 💚 | ✅ Heal Circle | ✅ Blessing | ✅ Right-Click | ✅ Resurrect | ✅ | **100%** |
| **Frieren** ⚪ | ❌ | ❌ | ❌ | ❌ | ❌ | **0%** |

## Résumé des corrections récentes (Session actuelle)

### Problèmes identifiés
- ❌ Effets visuels des skills manquants en multijoueur (sauf Sung qui était correct)
- ❌ Shield de Stark non affiché
- ❌ Aura de Guts (Beast) non affichée
- ❌ Ultimate de Guts (Berserker) sans effet visuel
- ❌ Effet de Stun de Stark pas assez visible

### Corrections apportées
- ✅ **Stark Skill A**: Ajout shockwave orange-rouge + lignes d'impact radiantes
- ✅ **Stark Skill E**: Ajout bouclier bleu pulsant qui suit le joueur
- ✅ **Guts Skill A**: Amélioration visuelle AOE rouge/noir avec expansion
- ✅ **Guts Skill B**: Ajout aura violette/noire pulsante qui suit le joueur
- ✅ **Guts Ultimate**: Ajout effet fullscreen avec image, shake, flash, particules
- ✅ **Serveur**: Création des `SkillEffect` pour tous les buffs visuels
- ✅ **Serveur**: Mise à jour automatique de position des effets suivant le joueur
- ✅ **Client**: Rendu correct de tous les nouveaux effets visuels

### Fichiers modifiés
**Client:**
- `apps/client/src/game/GameScene.ts`

**Server:**
- `apps/server/src/game/skills/ServerStarkSkills.ts`
- `apps/server/src/game/skills/ServerGutsSkills.ts`
- `apps/server/src/game/entities/ServerPlayer.ts`
- `apps/server/src/game/GameRoom.ts`

**Shared:**
- Aucune modification nécessaire (types déjà corrects)

---

## Prochaines étapes
1. ❌ **Frieren:** Implémenter ses skills (à définir)
2. ✅ **Tous les autres personnages:** COMPLÉTÉS ET FONCTIONNELS

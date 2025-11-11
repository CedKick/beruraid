# Synchronisation des Skills en Multijoueur

## État actuel
- ✅ Projectiles auto-attack (melee & ranged) synchronisés
- ❌ Skills des personnages NON synchronisés

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

### Étape 1 : Infrastructure
1. ✅ Ajouter `SkillEffect` et `PlayerBuff` aux types shared
2. ✅ Modifier `GameState` pour inclure `skillEffects` et `playerBuffs`
3. ✅ Ajouter méthode `handlePlayerSkill()` dans `GameRoom`

### Étape 2 : Stark (le plus simple - pas de projectiles complexes)
1. Implémenter Skill A (Stun AOE)
2. Implémenter Skill E (Shield)
3. Ajouter passif 5x damage quand boss stunné
4. Tester en multi

### Étape 3 : Guts (HP cost + buffs)
1. Implémenter Skill A (Rage - HP cost)
2. Implémenter Skill B (Invincibility)
3. Implémenter Ultimate (Berserker Armor)
4. Tester en multi

### Étape 4 : Fern (stacks + projectile)
1. Implémenter système de stacks
2. Implémenter Skill A (Fire AOE avec stacks)
3. Implémenter Skill E (Zoltraak laser)
4. Tester en multi

### Étape 5 : Frieren
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

## Priorisation
1. **Haute priorité:** Stark (simple, pas de mécaniques complexes)
2. **Moyenne priorité:** Guts (buffs/debuffs importants)
3. **Basse priorité:** Fern (stacks = plus complexe)
4. **À définir:** Frieren

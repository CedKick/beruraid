import Phaser from 'phaser';
import { Player } from './entities/Player';
import { Boss } from './entities/Boss';
import { CombatTimer } from './systems/CombatTimer';
import { CombatStats } from './systems/CombatStats';
import { DamageCalculator } from './systems/DamageCalculator';
import type { GameMode } from '../components/LobbyScreen';
import { socketService } from '../networking/SocketService';
import type { PlayerState } from '@beruraid/shared';

interface GameConfig {
  playerCount: number;
  characterId: string;
  gameMode: GameMode;
  roomCode?: string;
}

export class GameScene extends Phaser.Scene {
  private player!: Player;
  private boss!: Boss;
  private combatTimer!: CombatTimer;
  private combatStats!: CombatStats;
  private gameConfig?: GameConfig;
  private gameStarted = false;
  private countdownActive = false;
  private countdownNumber = 3;
  private countdownText?: Phaser.GameObjects.Text;
  private keys!: {
    Z: Phaser.Input.Keyboard.Key;
    Q: Phaser.Input.Keyboard.Key;
    S: Phaser.Input.Keyboard.Key;
    D: Phaser.Input.Keyboard.Key;
    A: Phaser.Input.Keyboard.Key;
    E: Phaser.Input.Keyboard.Key;
    R: Phaser.Input.Keyboard.Key;
    SPACE: Phaser.Input.Keyboard.Key;
  };

  // Multiplayer state
  private otherPlayers: Map<string, { sprite: Phaser.GameObjects.Sprite; nameText: Phaser.GameObjects.Text }> = new Map();
  private lastPositionUpdate = 0;
  private positionUpdateInterval = 100; // Send position every 100ms (10 times per second)
  private isMultiplayerMode = false;
  private serverGameState: any = null;
  private serverBossAttacks: Map<string, Phaser.GameObjects.GameObject> = new Map();
  private serverProjectiles: Map<string, Phaser.GameObjects.GameObject> = new Map();
  private serverSkillEffects: Map<string, Phaser.GameObjects.GameObject> = new Map();

  // Performance optimization: Throttle UI updates
  private lastUIUpdate = 0;
  private uiUpdateInterval = 50; // Update UI every 50ms (20 times per second instead of 60)

  // Performance optimization: Cache last movement state to avoid redundant network calls
  private lastMovementState = { up: false, down: false, left: false, right: false };

  constructor() {
    super({ key: 'GameScene' });
  }

  initializeGame(config: GameConfig) {
    this.gameConfig = config;
  }

  preload() {
    // Load world background
    this.load.image('world-underground', '/assets/world-underground.png');

    // Load boss sprite
    this.load.image('boss-ant', '/assets/boss-ant.png');

    // Load skill sprites
    this.load.image('zoltraak', '/assets/zoltraak.png');

    // Load character sprites - Stark
    this.load.image('stark_up', '/assets/stark_up.png');
    this.load.image('stark_down', '/assets/stark_down.png');
    this.load.image('stark_left', '/assets/stark_left.png');
    this.load.image('stark_right', '/assets/stark_right.png');

    // Load character sprites - Fern
    this.load.image('fern_up', '/assets/fern_up.png');
    this.load.image('fern_down', '/assets/fern_down.png');
    this.load.image('fern_left', '/assets/fern_left.png');
    this.load.image('fern_right', '/assets/fern_right.png');

    // Load character sprites - Frieren
    this.load.image('frieren_up', '/assets/frieren_up.png');
    this.load.image('frieren_down', '/assets/frieren_down.png');
    this.load.image('frieren_left', '/assets/frieren_left.png');
    this.load.image('frieren_right', '/assets/frieren_right.png');

    // Load character sprites - Guts
    this.load.image('guts_up', '/assets/guts_up.png');
    this.load.image('guts_down', '/assets/guts_down.png');
    this.load.image('guts_left', '/assets/guts_left.png');
    this.load.image('guts_right', '/assets/guts_right.png');

    // Load Guts ultimate image
    this.load.image('guts_ulti', '/assets/guts_ulti.png');

    // Load character sprites - Sung
    this.load.image('sung_up', 'https://res.cloudinary.com/dbg7m8qjd/image/upload/v1762863984/Sung_up_x6eurv.png');
    this.load.image('sung_down', 'https://res.cloudinary.com/dbg7m8qjd/image/upload/v1762863985/Sung_down_ayd206.png');
    this.load.image('sung_left', 'https://res.cloudinary.com/dbg7m8qjd/image/upload/v1762864060/Sung_left_enhs5y.png');
    this.load.image('sung_right', 'https://res.cloudinary.com/dbg7m8qjd/image/upload/v1762864061/Sung_right_exmwub.png');
    this.load.image('sung_death', 'https://res.cloudinary.com/dbg7m8qjd/image/upload/v1762865606/Sung_death_bqf9ve.png');

    // Load character sprites - Juhee
    this.load.image('juhee_up', '/assets/juhee_up.png');
    this.load.image('juhee_down', '/assets/juhee_down.png');
    this.load.image('juhee_left', '/assets/juhee_left.png');
    this.load.image('juhee_right', '/assets/juhee_right.png');
  }

  create() {
    // Disable right-click context menu on the game canvas
    this.input.mouse!.disableContextMenu();

    // Create arena background
    const width = this.scale.width;
    const height = this.scale.height;

    // Add world background image
    const worldBg = this.add.image(width / 2, height / 2, 'world-underground');
    // Scale to cover the entire screen
    const scaleX = width / worldBg.width;
    const scaleY = height / worldBg.height;
    const scale = Math.max(scaleX, scaleY);
    worldBg.setScale(scale);
    worldBg.setDepth(-1);

    // Setup input
    this.keys = {
      Z: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.Z),
      Q: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.Q),
      S: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      D: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.D),
      A: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      E: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.E),
      R: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.R),
      SPACE: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE),
    };

    // Initialize combat timer (3 minutes = 180 seconds)
    this.combatTimer = new CombatTimer(180);
    this.combatTimer.setOnTimeUpCallback(() => {
      this.onTimeUp();
    });

    // Initialize combat stats tracker
    this.combatStats = new CombatStats();

    // Create player with selected character
    const characterId = this.gameConfig?.characterId || 'stark';
    this.player = new Player(this, width / 2, height - 100, characterId);

    // Check if in multiplayer mode
    const isMultiplayer = this.gameConfig?.gameMode === 'multiplayer';

    if (!isMultiplayer) {
      // SOLO MODE: Create boss with player count for HP scaling
      const playerCount = this.gameConfig?.playerCount || 1;
      this.boss = new Boss(this, width / 2, 150, playerCount);
    } else {
      // MULTIPLAYER MODE: Create a simple boss sprite that will be controlled by server
      // The boss entity will be updated via server state
      const playerCount = this.gameConfig?.playerCount || 1;
      this.boss = new Boss(this, width / 2, 150, playerCount);
      // Note: In multiplayer, the boss logic is server-side, client just renders
    }

    // Setup collisions
    this.physics.add.overlap(
      this.player.getSprite(),
      this.boss.getAttacks(),
      this.handlePlayerHit,
      undefined,
      this
    );

    // Player projectiles vs Boss
    this.physics.add.overlap(
      this.player.getProjectiles(),
      this.boss.getSprite(),
      this.handleBossHit,
      undefined,
      this
    );

    // Setup event listeners for UI interactions
    this.events.on('addStatPoint', (stat: string) => {
      this.player.getStatsManager().addStatPoint(stat as any, 1);
    });

    // Listen for boss bar defeated events
    this.events.on('bossBarDefeated', (data: any) => {
      // Visual feedback for bar defeated
      this.showBarDefeatedNotification(data.rageCount);
    });

    // Listen for Stark's stun skill
    this.events.on('starkUseStunSkill', (data: any) => {
      this.handleStarkStunSkill(data.currentMana);
    });

    // Listen for Guts' skills
    this.events.on('gutsUseRageSkill', (data: any) => {
      this.handleGutsRageSkill(data.damage);
    });

    this.events.on('gutsUseBeastSkill', (data: any) => {
      this.handleGutsBeastSkill(data.currentMana);
    });

    this.events.on('gutsUseUltimate', (data: any) => {
      this.handleGutsUltimate(data.damage);
    });

    // Start countdown before combat begins
    this.startCountdown();

    // Setup multiplayer if in multiplayer mode
    if (this.gameConfig?.gameMode === 'multiplayer') {
      this.setupMultiplayer();
    }
  }

  private setupMultiplayer() {
    const socket = socketService.getSocket();
    if (!socket) {
      console.error('Socket not connected for multiplayer game');
      return;
    }

    console.log('🎮 Setting up multiplayer...');
    this.isMultiplayerMode = true;

    // Enable multiplayer mode on player
    this.player.setMultiplayerMode(true);

    // Listen for game state updates from server (60 FPS)
    socket.on('game:stateUpdate', (gameState: any) => {
      this.serverGameState = gameState;
      this.renderFromServerState(gameState);
    });

    // Listen for other players' position updates (legacy, for lobby)
    socket.on('game:playerUpdate', (playerState: PlayerState) => {
      // Don't render ourselves
      if (playerState.socketId === socketService.getSocketId()) {
        return;
      }

      this.updateOtherPlayer(playerState);
    });

    // Listen for players leaving
    socket.on('room:playerLeft', (data: { playerId: string }) => {
      this.removeOtherPlayer(data.playerId);
    });

    // Listen for game completion
    socket.on('game:completed', (data: any) => {
      console.log('🎉 Game completed!', data);
      this.onGameCompleted(data);
    });

    console.log('✅ Multiplayer setup complete');
  }

  private updateOtherPlayer(playerState: PlayerState) {
    const existing = this.otherPlayers.get(playerState.socketId);

    if (existing) {
      // Update existing player position
      existing.sprite.setPosition(playerState.position.x, playerState.position.y);
      existing.nameText.setPosition(playerState.position.x, playerState.position.y - 40);

      // Update sprite texture based on direction and character
      const textureKey = `${playerState.characterId}_${playerState.direction}`;
      if (this.textures.exists(textureKey)) {
        existing.sprite.setTexture(textureKey);
      }

      // Update alpha based on dodging state
      existing.sprite.setAlpha(playerState.isDodging ? 0.5 : 1);
    } else {
      // Create new player sprite
      const sprite = this.add.sprite(
        playerState.position.x,
        playerState.position.y,
        `${playerState.characterId}_down`
      );
      sprite.setScale(0.35); // Same scale as local player
      sprite.setDepth(10);

      // Create name text above player
      const nameText = this.add.text(
        playerState.position.x,
        playerState.position.y - 40,
        playerState.name,
        {
          fontSize: '14px',
          color: '#00ff00',
          fontStyle: 'bold',
          stroke: '#000000',
          strokeThickness: 3,
        }
      );
      nameText.setOrigin(0.5);
      nameText.setDepth(11);

      this.otherPlayers.set(playerState.socketId, { sprite, nameText });
      console.log(`👤 Added other player: ${playerState.name}`);
    }
  }

  private removeOtherPlayer(playerId: string) {
    const player = this.otherPlayers.get(playerId);
    if (player) {
      player.sprite.destroy();
      player.nameText.destroy();
      this.otherPlayers.delete(playerId);
      console.log(`👋 Removed other player: ${playerId}`);
    }
  }

  private startCountdown() {
    const width = this.scale.width;
    const height = this.scale.height;

    // Create countdown text
    this.countdownText = this.add.text(width / 2, height / 2, '3', {
      fontSize: '128px',
      color: '#ffd700',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 10,
    });
    this.countdownText.setOrigin(0.5);
    this.countdownText.setDepth(2000);
    this.countdownActive = true;
    this.countdownNumber = 3;

    // Countdown sequence
    const countdownInterval = this.time.addEvent({
      delay: 1000,
      repeat: 3,
      callback: () => {
        if (!this.countdownText || !this.countdownText.scene) return;

        this.countdownNumber--;

        if (this.countdownNumber > 0) {
          // Show numbers 2, 1
          this.countdownText.setText(this.countdownNumber.toString());

          // Pulse animation
          this.countdownText.setScale(1);
          this.tweens.add({
            targets: this.countdownText,
            scale: 1.3,
            duration: 300,
            yoyo: true,
            ease: 'Power2',
          });
        } else {
          // Show "GO!"
          this.countdownText.setText('GO!');
          this.countdownText.setColor('#00ff00');

          // Larger pulse for GO
          this.countdownText.setScale(1);
          this.tweens.add({
            targets: this.countdownText,
            scale: 1.5,
            alpha: 0,
            duration: 800,
            ease: 'Power2',
            onComplete: () => {
              if (this.countdownText && this.countdownText.scene) {
                this.countdownText.destroy();
              }
              this.countdownText = undefined;
            },
          });

          // Start combat
          this.countdownActive = false;
          this.gameStarted = true;
          this.combatTimer.start();
        }
      },
    });
  }

  private showBarDefeatedNotification(_rageCount: number) {
    // Camera shake effect only
    this.cameras.main.shake(300, 0.008);
  }

  private showFloatingDamage(damage: number, isCrit: boolean, critTier?: any, x?: number, y?: number) {
    const bossPos = this.boss.getSprite();
    const posX = x || bossPos.x + (Math.random() * 60 - 30);
    const posY = y || bossPos.y - 40;

    let fontSize = '24px';
    let color = '#ffffff';
    let strokeThickness = 4;

    if (isCrit && critTier) {
      fontSize = DamageCalculator.getCritFontSize(critTier);
      color = '#' + DamageCalculator.getCritColor(critTier).toString(16).padStart(6, '0');
      strokeThickness = 6;
    }

    const damageText = this.add.text(posX, posY, Math.floor(damage).toString(), {
      fontSize,
      color,
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness,
    });
    damageText.setOrigin(0.5);
    damageText.setDepth(1000);

    this.tweens.add({
      targets: damageText,
      y: posY - 80,
      alpha: 0,
      duration: 2500,
      ease: 'Power2',
      onComplete: () => {
        damageText.destroy();
      },
    });
  }

  private onTimeUp() {
    if (!this.gameStarted) return;

    // Time's up - game over
    this.events.emit('combatTimeUp', {
      rageCount: this.boss.getRageCount(),
      totalDamage: this.boss.getTotalDamageDealt(),
    });

    // Show time up message
    const width = this.scale.width;
    const height = this.scale.height;

    const text = this.add.text(width / 2, height / 2, "TIME'S UP!", {
      fontSize: '72px',
      color: '#ff0000',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 8,
    });
    text.setOrigin(0.5);
    text.setDepth(1000);

    // Pause the game
    this.physics.pause();
    this.gameStarted = false;
  }

  private renderFromServerState(gameState: any) {
    if (!gameState) return;

    // Render projectiles from server state
    if (gameState.projectiles) {
      this.renderProjectiles(gameState.projectiles);
    }

    // Render skill effects from server state
    if (gameState.skillEffects) {
      this.renderSkillEffects(gameState.skillEffects);
    }

    // Update boss from server state
    if (gameState.boss && this.boss) {
      const bossSprite = this.boss.getSprite();

      // Update position
      bossSprite.setPosition(gameState.boss.position.x, gameState.boss.position.y);

      // Update HP (use the boss's internal method to update HP bar)
      // We need to directly set the HP values
      const currentHp = gameState.boss.hp;
      const maxHp = gameState.boss.maxHp;

      // Force update boss HP display using 'as any' to access private properties
      (this.boss as any).currentHp = currentHp;
      (this.boss as any).maxHp = maxHp;
      (this.boss as any).healthSystem = {
        ...((this.boss as any).healthSystem || {}),
        currentHp: currentHp,
        maxHp: maxHp,
        rageCount: gameState.boss.rageCount,
        barsDefeated: gameState.boss.barsDefeated
      };

      // Update stun state
      if (gameState.boss.isStunned) {
        (this.boss as any).isStunned = true;
        (this.boss as any).stunEndTime = gameState.boss.stunEndTime;
      } else {
        (this.boss as any).isStunned = false;
      }

      // Render boss attacks from server state
      if (gameState.boss.attacks) {
        this.renderBossAttacks(gameState.boss.attacks);
      }
    }

    // Update all players
    if (gameState.players) {
      for (const playerState of gameState.players) {
        if (playerState.socketId === socketService.getSocketId()) {
          // CLIENT-SIDE PREDICTION RECONCILIATION
          // Only correct position if there's a significant difference from server
          const playerSprite = this.player.getSprite();
          const distanceX = Math.abs(playerSprite.x - playerState.position.x);
          const distanceY = Math.abs(playerSprite.y - playerState.position.y);
          const totalDistance = Math.sqrt(distanceX * distanceX + distanceY * distanceY);

          // If we're too far from server position (> 50px), smoothly correct it
          if (totalDistance > 50) {
            // Lerp towards server position (smooth correction)
            const lerpFactor = 0.2; // Adjust for smoothness (0.1 = very smooth, 0.5 = fast correction)
            const newX = playerSprite.x + (playerState.position.x - playerSprite.x) * lerpFactor;
            const newY = playerSprite.y + (playerState.position.y - playerSprite.y) * lerpFactor;
            playerSprite.setPosition(newX, newY);
          }
          // Otherwise, trust client prediction (no correction needed)

          // Update dodging state from server
          if (playerState.isDodging) {
            playerSprite.setAlpha(0.5);
          } else {
            playerSprite.setAlpha(1);
          }
        } else {
          // Update other players
          this.updateOtherPlayer(playerState);
        }
      }
    }
  }

  private renderBossAttacks(attacks: any[]) {
    // Track which attacks are currently in the server state
    const serverAttackIds = new Set(attacks.map((a: any) => a.id));

    // PERFORMANCE: Hide attacks instead of destroying them (object pooling)
    for (const [attackId, attackObj] of this.serverBossAttacks.entries()) {
      if (!serverAttackIds.has(attackId)) {
        (attackObj as any).setVisible?.(false);
        (attackObj as any).setActive?.(false);
        // Don't delete from map, keep for reuse
      }
    }

    // Create or update attacks from server
    for (const attack of attacks) {
      // Check if we already have this attack
      const existing = this.serverBossAttacks.get(attack.id);

      if (existing) {
        // PERFORMANCE: Reuse existing object instead of creating new one
        (existing as any).setVisible?.(true);
        (existing as any).setActive?.(true);

        // Attack already exists, update it
        if (attack.type === 'expandingCircle') {
          // Update expanding circle radius
          (existing as Phaser.GameObjects.Arc).setRadius(attack.radius || 20);
        }

        // Update position (in case attack moves)
        (existing as any).setPosition?.(attack.x, attack.y);

        // Update alpha based on active state (for warnings)
        if (!attack.active) {
          (existing as any).setAlpha?.(0.3); // Dim for warning
        } else {
          (existing as any).setAlpha?.(0.6); // Full brightness when active
        }

        continue;
      }

      // Create new attack visual
      let visual: Phaser.GameObjects.GameObject | null = null;

      switch (attack.type) {
        case 'laser': {
          // Create laser rectangle (starts as warning)
          const laser = this.add.rectangle(
            attack.x,
            attack.y,
            attack.width || 20,
            attack.height || 600,
            0xff0000,
            attack.active ? 0.6 : 0.3
          );
          laser.setDepth(50);
          // Rotate laser based on angle
          if (attack.angle !== undefined) {
            laser.setRotation(attack.angle);
          }
          visual = laser;
          break;
        }

        case 'aoe': {
          // Create AOE circle (starts as warning)
          const aoe = this.add.circle(
            attack.x,
            attack.y,
            attack.radius || 60,
            0xff6600,
            attack.active ? 0.5 : 0.2
          );
          aoe.setDepth(50);
          // Add stroke
          aoe.setStrokeStyle(2, 0xff6600);
          visual = aoe;
          break;
        }

        case 'expandingCircle': {
          // Create expanding circle
          const circle = this.add.circle(
            attack.x,
            attack.y,
            attack.radius || 20,
            0xff0000,
            attack.active ? 0.5 : 0.2
          );
          circle.setDepth(50);
          // Add stroke
          circle.setStrokeStyle(3, 0xff0000);
          visual = circle;
          break;
        }
      }

      if (visual) {
        this.serverBossAttacks.set(attack.id, visual);
      }
    }
  }

  private renderProjectiles(projectiles: any[]) {
    // Track which projectiles are in the server state
    const serverProjectileIds = new Set(projectiles.map((p: any) => p.id));

    // PERFORMANCE: Hide projectiles instead of destroying them (object pooling)
    for (const [projectileId, projectileObj] of this.serverProjectiles.entries()) {
      if (!serverProjectileIds.has(projectileId)) {
        (projectileObj as any).setVisible?.(false);
        (projectileObj as any).setActive?.(false);
        // Don't delete from map, keep for reuse
      }
    }

    // Create or update projectiles from server
    for (const projectile of projectiles) {
      const existing = this.serverProjectiles.get(projectile.id);

      if (existing) {
        // PERFORMANCE: Reuse existing object
        (existing as any).setVisible?.(true);
        (existing as any).setActive?.(true);
        // Update existing projectile position
        (existing as any).setPosition?.(projectile.x, projectile.y);
      } else {
        // Create new projectile visual
        let visual: Phaser.GameObjects.GameObject | null = null;

        if (projectile.type === 'melee') {
          // Melee slash
          const slash = this.add.rectangle(
            projectile.x,
            projectile.y,
            50,
            10,
            0xffffff,
            0.8
          );
          slash.setRotation(projectile.angle || 0);
          slash.setDepth(100);
          visual = slash;
        } else if (projectile.type === 'ranged') {
          // Ranged projectile
          const circle = this.add.circle(
            projectile.x,
            projectile.y,
            projectile.radius,
            0x00ffff,
            1
          );
          circle.setStrokeStyle(2, 0xffffff);
          circle.setDepth(100);
          visual = circle;
        }

        if (visual) {
          this.serverProjectiles.set(projectile.id, visual);
        }
      }
    }
  }

  private renderSkillEffects(skillEffects: any[]) {
    const now = Date.now();

    // Track which effects are in the server state
    const serverEffectIds = new Set(skillEffects.map((e: any) => e.id));

    // PERFORMANCE: Hide effects instead of destroying them (object pooling)
    for (const [effectId, effectObj] of this.serverSkillEffects.entries()) {
      if (!serverEffectIds.has(effectId)) {
        (effectObj as any).setVisible?.(false);
        (effectObj as any).setActive?.(false);
        // Don't delete from map, keep for reuse
      }
    }

    // Create or update skill effects from server
    for (const effect of skillEffects) {
      const existing = this.serverSkillEffects.get(effect.id);

      if (existing) {
        // PERFORMANCE: Reuse existing object
        (existing as any).setVisible?.(true);
        (existing as any).setActive?.(true);

        // Update existing effect
        const progress = (now - effect.createdAt) / (effect.expiresAt - effect.createdAt);

        switch (effect.effectType) {
          case 'fern_fire_aoe': {
            // Expanding fire AOE
            const maxRadius = effect.data?.maxRadius || 180;
            const currentRadius = effect.radius + (maxRadius - effect.radius) * progress;
            (existing as Phaser.GameObjects.Arc).setRadius(currentRadius);
            (existing as Phaser.GameObjects.Arc).setAlpha(1 - progress * 0.5);
            break;
          }

          case 'fern_zoltraak': {
            // Moving projectile
            (existing as any).setPosition?.(effect.x, effect.y);
            break;
          }

          case 'guts_rage_aoe': {
            // Expanding rage AOE
            const maxRadius = effect.data?.maxRadius || 120;
            const currentRadius = effect.radius + (maxRadius - effect.radius) * progress;
            (existing as Phaser.GameObjects.Arc).setRadius(currentRadius);
            (existing as Phaser.GameObjects.Arc).setAlpha(1 - progress * 0.5);
            break;
          }

          case 'stark_stun_aoe': {
            // Static AOE
            (existing as Phaser.GameObjects.Arc).setAlpha(1 - progress);
            break;
          }

          case 'juhee_heal_projectile': {
            // Moving heal projectile
            (existing as any).setPosition?.(effect.x, effect.y);
            break;
          }

          case 'sung_barrage_strike': {
            // Static AOE effect, just update alpha
            (existing as Phaser.GameObjects.Arc).setAlpha(1 - progress);
            break;
          }

          case 'sung_death_gamble': {
            // Static AOE circle (follows player in server, we just update alpha here)
            (existing as Phaser.GameObjects.Arc).setAlpha(0.4 - progress * 0.1);
            break;
          }

          case 'juhee_healing_circle': {
            // Static heal AOE
            (existing as Phaser.GameObjects.Arc).setAlpha(1 - progress);
            break;
          }

          case 'juhee_blessing': {
            // Static blessing AOE
            (existing as Phaser.GameObjects.Arc).setAlpha(1 - progress);
            break;
          }
        }
      } else {
        // Create new skill effect visual
        let visual: Phaser.GameObjects.GameObject | null = null;

        switch (effect.effectType) {
          case 'fern_fire_aoe': {
            // Expanding fire AOE
            const circle = this.add.circle(effect.x, effect.y, effect.radius, 0xff6600, 0.6);
            circle.setStrokeStyle(4, 0xff0000);
            circle.setDepth(90);
            visual = circle;
            break;
          }

          case 'fern_zoltraak': {
            // Purple beam projectile
            const beam = this.add.rectangle(effect.x, effect.y, 40, 15, 0x9900ff, 1);
            beam.setRotation(effect.angle || 0);
            beam.setDepth(90);

            // Add glow effect
            const glow = this.add.circle(effect.x, effect.y, 25, 0xcc66ff, 0.5);
            glow.setDepth(89);

            // Store both as container
            const container = this.add.container(effect.x, effect.y, [glow, beam]);
            container.setDepth(90);
            visual = container;
            break;
          }

          case 'stark_stun_aoe': {
            // Yellow AOE stun effect
            const circle = this.add.circle(effect.x, effect.y, effect.radius || 120, 0xffff00, 0.4);
            circle.setStrokeStyle(5, 0xffa500);
            circle.setDepth(90);
            visual = circle;
            break;
          }

          case 'guts_rage_aoe': {
            // Red expanding rage AOE
            const circle = this.add.circle(effect.x, effect.y, effect.radius, 0xff0000, 0.7);
            circle.setStrokeStyle(5, 0x990000);
            circle.setDepth(90);
            visual = circle;
            break;
          }

          case 'juhee_heal_projectile': {
            // Green heal projectile
            const healCircle = this.add.circle(effect.x, effect.y, effect.radius || 20, 0x00ff00, 0.8);
            healCircle.setStrokeStyle(3, 0x00ff88);
            healCircle.setDepth(90);

            // Add sparkle effect
            const sparkle = this.add.circle(effect.x, effect.y, (effect.radius || 20) * 0.6, 0xccffcc, 0.6);
            sparkle.setDepth(89);

            // Store both as container
            const container = this.add.container(effect.x, effect.y, [sparkle, healCircle]);
            container.setDepth(90);
            visual = container;
            break;
          }

          case 'sung_barrage_strike': {
            // Purple dagger strike AOE
            const circle = this.add.circle(effect.x, effect.y, effect.radius || 40, 0x8b00ff, 0.6);
            circle.setStrokeStyle(4, 0xda70d6, 1);
            circle.setDepth(90);
            visual = circle;
            break;
          }

          case 'sung_death_gamble': {
            // Blue or Red circle (based on isBlue)
            const isBlue = effect.data?.isBlue || false;
            const color = isBlue ? 0x00bfff : 0xff0000;
            const glowColor = isBlue ? 0x87ceeb : 0xff6347;
            const circle = this.add.circle(effect.x, effect.y, effect.radius || 80, color, 0.4);
            circle.setStrokeStyle(5, glowColor, 0.9);
            circle.setDepth(90);
            visual = circle;
            break;
          }

          case 'juhee_healing_circle': {
            // Green healing circle
            const healCircle = this.add.circle(effect.x, effect.y, effect.radius || 120, 0x00ff88, 0.45);
            healCircle.setStrokeStyle(4, 0x00ff00, 1);
            healCircle.setDepth(90);
            visual = healCircle;
            break;
          }

          case 'juhee_blessing': {
            // Golden blessing circle
            const blessCircle = this.add.circle(effect.x, effect.y, effect.radius || 150, 0xffd700, 0.4);
            blessCircle.setStrokeStyle(5, 0xffaa00, 1);
            blessCircle.setDepth(90);
            visual = blessCircle;
            break;
          }
        }

        if (visual) {
          this.serverSkillEffects.set(effect.id, visual);
        }
      }
    }
  }

  private onGameCompleted(data: any) {
    console.log('Game completed:', data);
    this.gameStarted = false;
    this.physics.pause();

    // Show victory/defeat message
    const width = this.scale.width;
    const height = this.scale.height;

    const message = data.winner === 'players' ? 'VICTORY!' : 'DEFEAT!';
    const color = data.winner === 'players' ? '#00ff00' : '#ff0000';

    const text = this.add.text(width / 2, height / 2, message, {
      fontSize: '72px',
      color: color,
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 8,
    });
    text.setOrigin(0.5);
    text.setDepth(2000);
  }

  update(time: number, delta: number) {
    if (!this.gameStarted) return;

    // Update combat timer
    this.combatTimer.update(delta);

    // Get player input
    const movement = {
      up: this.keys.Z.isDown,
      down: this.keys.S.isDown,
      left: this.keys.Q.isDown,
      right: this.keys.D.isDown,
    };

    const actions = {
      dodge: Phaser.Input.Keyboard.JustDown(this.keys.SPACE),
      skill1: Phaser.Input.Keyboard.JustDown(this.keys.A),
      skill2: Phaser.Input.Keyboard.JustDown(this.keys.E),
      ultimate: Phaser.Input.Keyboard.JustDown(this.keys.R),
    };

    // In multiplayer mode, send inputs to server AND apply movement locally (client-side prediction)
    if (this.isMultiplayerMode) {
      const socket = socketService.getSocket();
      if (socket) {
        // PERFORMANCE: Only send movement if it changed (avoid spamming server with same input)
        const movementChanged =
          movement.up !== this.lastMovementState.up ||
          movement.down !== this.lastMovementState.down ||
          movement.left !== this.lastMovementState.left ||
          movement.right !== this.lastMovementState.right;

        if (movementChanged) {
          socket.emit('game:movement', movement);
          this.lastMovementState = { ...movement };
        }

        // Send dodge action
        if (actions.dodge) {
          socket.emit('game:dodge');
        }

        // Send skill actions and create local visual effects
        const playerStats = this.player.getStats();
        const mousePos = this.input.activePointer;

        if (actions.skill1) {
          socket.emit('game:skill', { skillId: 1, targetX: mousePos.worldX, targetY: mousePos.worldY });
          // Create local visual effects
          const fernSkills = this.player.getFernSkills();
          if (fernSkills) {
            fernSkills.useSkill1(playerStats.currentMana);
          }
          const starkSkills = this.player.getStarkSkills();
          if (starkSkills) {
            const bosses = [{ x: this.boss.getSprite().x, y: this.boss.getSprite().y }];
            starkSkills.useSkill1(playerStats.currentMana, bosses);
          }
          const gutsSkills = this.player.getGutsSkills();
          if (gutsSkills) {
            gutsSkills.useSkill1(playerStats.currentHp, playerStats.maxHp, gutsSkills.isInvincible());
          }
          const sungSkills = this.player.getSungSkills();
          if (sungSkills) {
            sungSkills.useSkill1(playerStats.currentMana, 0, 0);
          }
          const juheeSkills = this.player.getJuheeSkills();
          if (juheeSkills) {
            juheeSkills.useSkill1(playerStats.currentMana);
          }
        }
        if (actions.skill2) {
          socket.emit('game:skill', { skillId: 2, targetX: mousePos.worldX, targetY: mousePos.worldY });
          // Create local visual effects
          const fernSkills = this.player.getFernSkills();
          if (fernSkills) {
            fernSkills.useSkill2(playerStats.currentMana, mousePos.worldX, mousePos.worldY);
          }
          const starkSkills = this.player.getStarkSkills();
          if (starkSkills) {
            starkSkills.useSkill2(playerStats.currentMana);
          }
          const gutsSkills = this.player.getGutsSkills();
          if (gutsSkills) {
            gutsSkills.useSkill2(playerStats.currentMana);
          }
          const sungSkills = this.player.getSungSkills();
          if (sungSkills) {
            sungSkills.useSkill2(playerStats.currentMana);
          }
          const juheeSkills = this.player.getJuheeSkills();
          if (juheeSkills) {
            juheeSkills.useSkill2(playerStats.currentMana);
          }
        }
        if (actions.ultimate) {
          socket.emit('game:skill', { skillId: 3 });
          // Create local visual effects
          const gutsSkills = this.player.getGutsSkills();
          if (gutsSkills) {
            gutsSkills.useUltimate(playerStats.currentMana, playerStats.attack);
          }
        }
      }

      // CLIENT-SIDE PREDICTION: Apply movement locally for instant feedback
      // The player will move immediately on the client, and the server will
      // send authoritative position updates for reconciliation
      const body = this.player.getSprite().body as Phaser.Physics.Arcade.Body;
      let velocityX = 0;
      let velocityY = 0;

      if (movement.left) velocityX -= 300;
      if (movement.right) velocityX += 300;
      if (movement.up) velocityY -= 300;
      if (movement.down) velocityY += 300;

      // Normalize diagonal movement
      if (velocityX !== 0 && velocityY !== 0) {
        velocityX *= 0.707;
        velocityY *= 0.707;
      }

      body.setVelocity(velocityX, velocityY);

      // Update player sprite direction locally
      if (velocityX !== 0 || velocityY !== 0) {
        let newDirection: 'up' | 'down' | 'left' | 'right' = this.player.getDirection();

        // Prioritize vertical movement for sprite direction
        if (Math.abs(velocityY) > Math.abs(velocityX)) {
          newDirection = velocityY < 0 ? 'up' : 'down';
        } else if (velocityX !== 0) {
          newDirection = velocityX < 0 ? 'left' : 'right';
        }

        // Update texture
        const textureKey = `${this.gameConfig?.characterId}_${newDirection}`;
        if (this.textures.exists(textureKey)) {
          this.player.getSprite().setTexture(textureKey);
        }
      }

      // Update player skills locally for cooldowns
      const deltaInMs = delta;
      if (this.player.getFernSkills()) {
        this.player.getFernSkills()?.update(deltaInMs);
      }
      if (this.player.getStarkSkills()) {
        this.player.getStarkSkills()?.update(deltaInMs);
      }
      if (this.player.getGutsSkills()) {
        this.player.getGutsSkills()?.update(deltaInMs);
      }

      // Update UI from server state
      if (this.serverGameState) {
        this.updateUIFromServerState(this.serverGameState);
      }
      return;
    }

    // SOLO MODE - Original client-side logic
    this.player.update(time, delta, movement, actions);

    // Store player position for boss AI
    const playerPos = this.player.getPosition();
    this.data.set('playerPosition', playerPos);

    // Update boss
    this.boss.update(time, delta, playerPos);

    // Check ranged projectile collisions with boss
    this.checkRangedProjectileCollisions();

    // Check Fern's skill collisions if playing as Fern
    if (this.gameConfig?.characterId === 'fern') {
      this.checkFernSkillCollisions();
    }

    // Update UI
    this.updateUI();
  }

  private broadcastPlayerState(time: number) {
    // Throttle position updates (10 times per second)
    if (time - this.lastPositionUpdate < this.positionUpdateInterval) {
      return;
    }

    this.lastPositionUpdate = time;

    const socket = socketService.getSocket();
    if (!socket) return;

    const playerPos = this.player.getPosition();
    const playerStats = this.player.getStats();

    // Emit partial player state
    socket.emit('player:update', {
      socketId: socketService.getSocketId(),
      position: playerPos,
      direction: this.player.getDirection(),
      isDodging: this.player.isInvincible(),
      stats: {
        currentHp: playerStats.currentHp,
        maxHp: playerStats.maxHp,
      },
    } as Partial<PlayerState>);
  }

  private handleStarkStunSkill(currentMana: number) {
    const starkSkills = this.player.getStarkSkills();
    if (!starkSkills) return;

    // Try to use the stun skill
    const bosses = [{ x: this.boss.getSprite().x, y: this.boss.getSprite().y }];
    const result = starkSkills.useSkill1(currentMana, bosses);

    if (result.success) {
      // Consume mana
      this.player.getStatsManager().useMana(result.manaCost);

      // Apply stun to boss
      this.boss.stun(starkSkills.getStunDuration(), this.time.now);

      // Show stun debuff icon
      this.showDebuffIcon('stun');

      // Calculate and apply damage (x5 multiplier during stun for Stark)
      const playerStats = this.player.getStats();
      const damageResult = DamageCalculator.calculateDamage(
        result.damage * 5, // x5 damage during stun
        playerStats.attack,
        playerStats.defPen,
        this.boss.getDefense(),
        playerStats.critRate,
        playerStats.critDamage,
        playerStats.damageBoost
      );

      this.boss.takeDamage(damageResult.damage, this.player.getElement());
      this.combatStats.addDamage(damageResult.damage);

      // Show floating damage
      this.showFloatingDamage(
        damageResult.damage,
        damageResult.isCrit,
        damageResult.critTier,
        this.boss.getSprite().x,
        this.boss.getSprite().y
      );

      // Check if boss is dead
      if (this.boss.isDead()) {
        this.onBossDefeated();
      }
    }
  }

  private handleGutsRageSkill(damage: number) {
    const gutsSkills = this.player.getGutsSkills();
    if (!gutsSkills) return;

    // Get Guts skill1 effects (AOE circles)
    const effects = gutsSkills.getSkill1Effects();
    if (effects.length === 0) return;

    // Check collision with boss for each AOE effect
    effects.forEach((effect: any) => {
      if (effect.active && !effect.hasHitBoss) {
        const distance = Phaser.Math.Distance.Between(
          effect.x,
          effect.y,
          this.boss.getSprite().x,
          this.boss.getSprite().y
        );

        // Check if boss is within AOE radius
        const effectRadius = effect.radius || effect.width / 2;
        if (distance <= effectRadius + 50) {
          effect.hasHitBoss = true;

          // Calculate and apply damage
          const playerStats = this.player.getStats();
          const damageResult = DamageCalculator.calculateDamage(
            damage,
            playerStats.attack,
            playerStats.defPen,
            this.boss.getDefense(),
            playerStats.critRate,
            playerStats.critDamage,
            playerStats.damageBoost
          );

          this.boss.takeDamage(damageResult.damage, this.player.getElement());
          this.combatStats.addDamage(damageResult.damage);

          // Show floating damage
          this.showFloatingDamage(
            damageResult.damage,
            damageResult.isCrit,
            damageResult.critTier,
            this.boss.getSprite().x,
            this.boss.getSprite().y
          );

          // Check if boss is dead
          if (this.boss.isDead()) {
            this.onBossDefeated();
          }
        }
      }
    });
  }

  private handleGutsBeastSkill(currentMana: number) {
    const gutsSkills = this.player.getGutsSkills();
    if (!gutsSkills) return;

    // Try to use Beast of Darkness skill
    const result = gutsSkills.useSkill2(currentMana);

    if (result.success) {
      // Consume mana
      this.player.getStatsManager().useMana(result.manaCost);

      // If stun was successful, apply it to the boss
      if (result.stunned) {
        this.boss.stun(gutsSkills.getStunDuration(), this.time.now);
        this.showDebuffIcon('stun');
      }
    }
  }

  private handleGutsUltimate(damage: number) {
    const gutsSkills = this.player.getGutsSkills();
    if (!gutsSkills) return;

    // Calculate and apply the initial burst damage
    const playerStats = this.player.getStats();
    const damageResult = DamageCalculator.calculateDamage(
      damage,
      playerStats.attack,
      playerStats.defPen,
      this.boss.getDefense(),
      playerStats.critRate,
      playerStats.critDamage,
      playerStats.damageBoost
    );

    this.boss.takeDamage(damageResult.damage, this.player.getElement());
    this.combatStats.addDamage(damageResult.damage);

    // Show floating damage
    this.showFloatingDamage(
      damageResult.damage,
      damageResult.isCrit,
      damageResult.critTier,
      this.boss.getSprite().x,
      this.boss.getSprite().y
    );

    // Check if boss is dead
    if (this.boss.isDead()) {
      this.onBossDefeated();
    }
  }

  private handlePlayerHit(
    _playerObj:
      | Phaser.Types.Physics.Arcade.GameObjectWithBody
      | Phaser.Tilemaps.Tile
      | Phaser.Physics.Arcade.Body
      | Phaser.Physics.Arcade.StaticBody,
    attackObj:
      | Phaser.Types.Physics.Arcade.GameObjectWithBody
      | Phaser.Tilemaps.Tile
      | Phaser.Physics.Arcade.Body
      | Phaser.Physics.Arcade.StaticBody
  ) {
    if (!this.player.isInvincible()) {
      // Get damage specific to this attack
      let damage = this.boss.getDamage(attackObj);
      const defPen = this.boss.getDefPen();

      // Check if Stark's shield is active (reduces damage by 90%)
      if (this.player.isStarkShieldActive()) {
        const starkSkills = this.player.getStarkSkills();
        if (starkSkills) {
          damage *= (1 - starkSkills.getShieldDamageReduction());
        }
      }

      this.player.takeDamage(damage, defPen);

      // Visual feedback - stronger shake for bigger attacks
      const isExpandingCircle = (attackObj as any).isExpandingCircle;
      if (isExpandingCircle) {
        this.cameras.main.shake(400, 0.01);
      } else {
        this.cameras.main.shake(200, 0.005);
      }
    }
  }

  private handleBossHit(
    _bossObj:
      | Phaser.Types.Physics.Arcade.GameObjectWithBody
      | Phaser.Tilemaps.Tile
      | Phaser.Physics.Arcade.Body
      | Phaser.Physics.Arcade.StaticBody,
    projectileObj:
      | Phaser.Types.Physics.Arcade.GameObjectWithBody
      | Phaser.Tilemaps.Tile
      | Phaser.Physics.Arcade.Body
      | Phaser.Physics.Arcade.StaticBody
  ) {
    // Get projectile position before destroying
    const projectileX = (projectileObj as any).x;
    const projectileY = (projectileObj as any).y;

    // Destroy projectile
    (projectileObj as Phaser.GameObjects.GameObject).destroy();

    // Get player stats
    const playerStats = this.player.getStats();

    // Base damage - multiply by 5 if Stark is attacking a stunned boss
    let baseDamage = 10;
    if (this.gameConfig?.characterId === 'stark' && this.boss.getIsStunned()) {
      baseDamage *= 5;
    }

    // Apply Guts' ultimate DPS multiplier if active
    let gutsUltimateMultiplier = 1;
    if (this.gameConfig?.characterId === 'guts') {
      const gutsSkills = this.player.getGutsSkills();
      if (gutsSkills && gutsSkills.isUltimateActive()) {
        gutsUltimateMultiplier = gutsSkills.getUltimateDpsMultiplier();
      }
    }

    // Calculate damage with new system
    const damageResult = DamageCalculator.calculateDamage(
      baseDamage * gutsUltimateMultiplier,
      playerStats.attack,
      playerStats.defPen,
      this.boss.getDefense(),
      playerStats.critRate,
      playerStats.critDamage,
      playerStats.damageBoost
    );

    // Apply damage to boss
    this.boss.takeDamage(damageResult.damage, this.player.getElement());

    // Track damage in combat stats
    this.combatStats.addDamage(damageResult.damage);

    // Show floating damage number
    this.showFloatingDamage(
      damageResult.damage,
      damageResult.isCrit,
      damageResult.critTier,
      projectileX,
      projectileY
    );

    // Visual feedback
    const explosionColor = damageResult.isCrit
      ? DamageCalculator.getCritColor(damageResult.critTier!)
      : 0xffff00;

    const explosion = this.add.circle(projectileX, projectileY, 15, explosionColor, 0.8);

    this.tweens.add({
      targets: explosion,
      alpha: 0,
      scale: damageResult.isCrit ? 3 : 2,
      duration: 200,
      onComplete: () => {
        if (explosion && explosion.scene) {
          explosion.destroy();
        }
      },
    });

    // Check if boss is dead
    if (this.boss.isDead()) {
      this.onBossDefeated();
    }
  }

  private checkRangedProjectileCollisions() {
    const rangedProjectiles = this.player.getRangedProjectiles();
    const bossSprite = this.boss.getSprite();

    rangedProjectiles.forEach((projectile, index) => {
      if (!projectile || !projectile.scene) {
        rangedProjectiles.splice(index, 1);
        return;
      }

      // Check if projectile overlaps with boss
      if (this.physics.overlap(projectile, bossSprite)) {
        // Get player stats
        const playerStats = this.player.getStats();

        // Base damage - multiply by 5 if Stark is attacking a stunned boss
        let baseDamage = 10;
        if (this.gameConfig?.characterId === 'stark' && this.boss.getIsStunned()) {
          baseDamage *= 5;
        }

        // Calculate damage with new system
        const damageResult = DamageCalculator.calculateDamage(
          baseDamage,
          playerStats.attack,
          playerStats.defPen,
          this.boss.getDefense(),
          playerStats.critRate,
          playerStats.critDamage,
          playerStats.damageBoost
        );

        // Apply damage to boss
        this.boss.takeDamage(damageResult.damage, this.player.getElement());

        // Track damage in combat stats
        this.combatStats.addDamage(damageResult.damage);

        // Show floating damage number
        this.showFloatingDamage(
          damageResult.damage,
          damageResult.isCrit,
          damageResult.critTier,
          projectile.x,
          projectile.y
        );

        // Visual feedback
        const explosionColor = damageResult.isCrit
          ? DamageCalculator.getCritColor(damageResult.critTier!)
          : 0xffff00;

        const explosion = this.add.circle(
          projectile.x,
          projectile.y,
          15,
          explosionColor,
          0.8
        );

        this.tweens.add({
          targets: explosion,
          alpha: 0,
          scale: damageResult.isCrit ? 3 : 2,
          duration: 200,
          onComplete: () => {
            if (explosion && explosion.scene) {
              explosion.destroy();
            }
          },
        });

        // Remove projectile
        projectile.destroy();
        rangedProjectiles.splice(index, 1);

        // Check if boss is dead
        if (this.boss.isDead()) {
          this.onBossDefeated();
        }
      }
    });
  }

  private checkFernSkillCollisions() {
    const fernSkills = this.player.getFernSkills();
    if (!fernSkills) return;

    const bossSprite = this.boss.getSprite();
    const playerStats = this.player.getStats();

    // Check Skill A (AOE Fire) collisions - hit once per AOE with 0.2s cooldown
    const skill1Effects = fernSkills.getSkill1Effects();
    skill1Effects.forEach((effect, index) => {
      if (!effect || !effect.scene) {
        skill1Effects.splice(index, 1);
        return;
      }

      // Check if AOE overlaps with boss AND hasn't hit yet AND cooldown allows
      const hasHit = (effect as any).hasHit;
      if (!hasHit && this.physics.overlap(effect, bossSprite) && fernSkills.canHitWithSkill1()) {
        const stackMultiplier = (effect as any).stackMultiplier || 1;
        const baseDamage = 15 * stackMultiplier;

        // Calculate damage with player stats
        const damageResult = DamageCalculator.calculateDamage(
          baseDamage,
          playerStats.attack,
          playerStats.defPen,
          this.boss.getDefense(),
          playerStats.critRate,
          playerStats.critDamage,
          playerStats.damageBoost
        );

        // Apply damage
        this.boss.takeDamage(damageResult.damage, this.player.getElement());
        this.combatStats.addDamage(damageResult.damage);

        // Show floating damage
        this.showFloatingDamage(
          damageResult.damage,
          damageResult.isCrit,
          damageResult.critTier,
          bossSprite.x,
          bossSprite.y
        );

        // Visual feedback
        const explosionColor = damageResult.isCrit
          ? DamageCalculator.getCritColor(damageResult.critTier!)
          : 0x4169e1;

        const explosion = this.add.circle(bossSprite.x, bossSprite.y, 25, explosionColor, 0.8);
        this.tweens.add({
          targets: explosion,
          alpha: 0,
          scale: 2,
          duration: 200,
          onComplete: () => {
            if (explosion && explosion.scene) {
              explosion.destroy();
            }
          },
        });

        // Mark this AOE as having hit
        (effect as any).hasHit = true;

        // Check if boss is dead
        if (this.boss.isDead()) {
          this.onBossDefeated();
        }
      }
    });

    // Check Skill E (Zoltraak) collisions - hit only once
    const skill2Effects = fernSkills.getSkill2Effects();
    skill2Effects.forEach((effect, index) => {
      if (!effect || !effect.scene) {
        skill2Effects.splice(index, 1);
        return;
      }

      // Check if Zoltraak overlaps with boss AND hasn't hit yet
      const hasHit = (effect as any).hasHit;
      if (!hasHit && this.physics.overlap(effect, bossSprite)) {
        const baseDamage = 15 * 30; // 30x multiplier

        // Calculate damage with player stats
        const damageResult = DamageCalculator.calculateDamage(
          baseDamage,
          playerStats.attack,
          playerStats.defPen,
          this.boss.getDefense(),
          playerStats.critRate,
          playerStats.critDamage,
          playerStats.damageBoost
        );

        // Apply damage
        this.boss.takeDamage(damageResult.damage, this.player.getElement());
        this.combatStats.addDamage(damageResult.damage);

        // Show floating damage
        this.showFloatingDamage(
          damageResult.damage,
          damageResult.isCrit,
          damageResult.critTier,
          bossSprite.x,
          bossSprite.y
        );

        // Large visual feedback for powerful Zoltraak
        const explosionColor = damageResult.isCrit
          ? DamageCalculator.getCritColor(damageResult.critTier!)
          : 0xffffff;

        const explosion = this.add.circle(bossSprite.x, bossSprite.y, 40, explosionColor, 0.9);
        this.tweens.add({
          targets: explosion,
          alpha: 0,
          scale: 3,
          duration: 300,
          onComplete: () => {
            if (explosion && explosion.scene) {
              explosion.destroy();
            }
          },
        });

        // Destroy the Zoltraak beam after hitting
        effect.destroy();
        skill2Effects.splice(index, 1);

        // Check if boss is dead
        if (this.boss.isDead()) {
          this.onBossDefeated();
        }
      }
    });

    // Store Fern stacks for UI
    const fernStacks = this.player.getFernSkillStacks();
    this.data.set('fernStacks', fernStacks);
  }

  private debuffIcons: Map<string, Phaser.GameObjects.Container> = new Map();

  private bossDefeated = false;

  private showDebuffIcon(debuffType: string) {
    // Remove existing icon if present
    if (this.debuffIcons.has(debuffType)) {
      const existingIcon = this.debuffIcons.get(debuffType);
      if (existingIcon && existingIcon.scene) {
        existingIcon.destroy();
      }
      this.debuffIcons.delete(debuffType);
    }

    const bossSprite = this.boss.getSprite();

    // Container for the debuff icon
    const container = this.add.container(bossSprite.x, bossSprite.y + 80);
    container.setDepth(100);

    // Create debuff icon based on type
    let iconColor = 0xffff00;
    let iconText = '⚡';
    let duration = 2000; // Default 2 seconds

    switch (debuffType) {
      case 'stun':
        iconColor = 0xffd700;
        iconText = '⚡';
        duration = 2000;
        break;
      // Add more debuff types here later
    }

    // Background circle
    const bg = this.add.circle(0, 0, 20, 0x000000, 0.7);
    bg.setStrokeStyle(3, iconColor);

    // Icon text
    const text = this.add.text(0, 0, iconText, {
      fontSize: '24px',
      color: '#' + iconColor.toString(16).padStart(6, '0'),
    });
    text.setOrigin(0.5);

    container.add([bg, text]);

    // Store in map
    this.debuffIcons.set(debuffType, container);

    // Pulse animation
    this.tweens.add({
      targets: container,
      scale: 1.1,
      duration: 300,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    // Update position to follow boss
    const updatePosition = () => {
      if (container && container.scene && bossSprite && bossSprite.scene) {
        // Position the icon below the boss
        const offset = this.debuffIcons.size * 45;
        const index = Array.from(this.debuffIcons.keys()).indexOf(debuffType);
        container.setPosition(bossSprite.x - offset / 2 + index * 45, bossSprite.y + 80);
      }
    };

    // Update every frame
    this.events.on('update', updatePosition);

    // Auto-remove after duration
    this.time.delayedCall(duration, () => {
      this.events.off('update', updatePosition);
      if (container && container.scene) {
        this.tweens.add({
          targets: container,
          alpha: 0,
          scale: 0,
          duration: 200,
          onComplete: () => {
            if (container && container.scene) {
              container.destroy();
            }
            this.debuffIcons.delete(debuffType);
          }
        });
      }
    });
  }

  private onBossDefeated() {
    if (this.bossDefeated) return;
    this.bossDefeated = true;

    // Boss death animation
    this.tweens.add({
      targets: this.boss.getSprite(),
      alpha: 0,
      scale: 0,
      duration: 1000,
      onComplete: () => {
        // Grant experience to player
        const expReward = this.boss.getExperienceReward();
        this.player.gainExperience(expReward);

        // Show victory message
        this.events.emit('bossDefeated', expReward);
      },
    });
  }

  private updateUI() {
    // PERFORMANCE: Throttle UI updates to 20 FPS instead of 60 FPS
    const now = this.time.now;
    if (now - this.lastUIUpdate < this.uiUpdateInterval) {
      return;
    }
    this.lastUIUpdate = now;

    // UI is handled by React overlay
    const playerStats = this.player.getStats();

    // Solo mode: create single-player leaderboard
    const playerScores = [
      {
        name: 'You',
        characterId: this.gameConfig?.characterId || 'stark',
        dps: this.combatStats.getDPS(),
        hps: this.combatStats.getHPS(),
        totalDamage: this.combatStats.getTotalDamage(),
        totalHeal: this.combatStats.getTotalHeal(),
        isAlive: playerStats.currentHp > 0,
        isMe: true
      }
    ];

    const gameState = {
      playerHp: playerStats.currentHp,
      playerMaxHp: playerStats.maxHp,
      playerMana: playerStats.currentMana,
      playerMaxMana: playerStats.maxMana,
      playerLevel: playerStats.level,
      playerExp: playerStats.experience,
      playerExpToNext: playerStats.experienceToNextLevel,
      playerStats: playerStats,
      bossHp: this.boss.getHp(),
      bossMaxHp: this.boss.getMaxHp(),
      bossRageCount: this.boss.getRageCount(),
      bossBarsDefeated: this.boss.getBarsDefeated(),
      bossNextBarMaxHp: this.boss.getNextBarMaxHp(),
      bossTotalDamage: this.boss.getTotalDamageDealt(),
      bossBarMultiplier: this.boss.getBarsDefeated() + 1,
      skill1Cooldown: this.player.getSkill1Cooldown(),
      skill2Cooldown: this.player.getSkill2Cooldown(),
      ultimateCooldown: this.player.getUltimateCooldown(),
      isDodging: this.player.isInvincible(),
      remainingTime: this.combatTimer.getFormattedRemainingTime(),
      remainingTimeSeconds: this.combatTimer.getRemainingTimeInSeconds(),
      isTimeCritical: this.combatTimer.isCritical(),
      isTimeWarning: this.combatTimer.isWarning(),
      dps: this.combatStats.getDPS(),
      totalDamage: this.combatStats.getTotalDamage(),
      hps: this.combatStats.getHPS(),
      totalHeal: this.combatStats.getTotalHeal(),
      playerScores: playerScores,
      isPlayerDead: playerStats.currentHp <= 0,
    };

    // Emit event for React to catch
    this.events.emit('gameStateUpdate', gameState);
  }

  private updateUIFromServerState(serverState: any) {
    // PERFORMANCE: Throttle UI updates to 20 FPS instead of 60 FPS
    const now = Date.now();
    if (now - this.lastUIUpdate < this.uiUpdateInterval) {
      return;
    }
    this.lastUIUpdate = now;

    // Find our player in the server state
    const ourPlayer = serverState.players.find(
      (p: any) => p.socketId === socketService.getSocketId()
    );

    if (!ourPlayer) return;

    // Format remaining time (ms to MM:SS)
    const remainingSeconds = Math.floor(serverState.remainingTime / 1000);
    const minutes = Math.floor(remainingSeconds / 60);
    const seconds = remainingSeconds % 60;
    const remainingTime = `${minutes}:${seconds.toString().padStart(2, '0')}`;

    // Build leaderboard from all players
    const playerScores = serverState.players.map((p: any) => ({
      name: p.name,
      characterId: p.characterId,
      dps: p.dps || 0,
      hps: p.hps || 0,
      totalDamage: p.totalDamage || 0,
      totalHeal: p.totalHeal || 0,
      isAlive: p.isAlive,
      isMe: p.socketId === socketService.getSocketId()
    }));

    const gameState = {
      playerHp: ourPlayer.stats.currentHp,
      playerMaxHp: ourPlayer.stats.maxHp,
      playerMana: ourPlayer.stats.currentMana,
      playerMaxMana: ourPlayer.stats.maxMana,
      playerLevel: ourPlayer.stats.level,
      playerExp: ourPlayer.stats.experience || 0,
      playerExpToNext: ourPlayer.stats.experienceToNextLevel || 100,
      playerStats: ourPlayer.stats,
      bossHp: serverState.boss.hp,
      bossMaxHp: serverState.boss.maxHp,
      bossRageCount: serverState.boss.rageCount,
      bossBarsDefeated: serverState.boss.barsDefeated,
      bossNextBarMaxHp: serverState.boss.nextBarMaxHp,
      bossTotalDamage: serverState.boss.totalDamageDealt || 0,
      bossBarMultiplier: serverState.boss.barsDefeated + 1,
      skill1Cooldown: ourPlayer.skill1Cooldown || 0,
      skill2Cooldown: ourPlayer.skill2Cooldown || 0,
      ultimateCooldown: ourPlayer.ultimateCooldown || 0,
      isDodging: ourPlayer.isDodging,
      remainingTime: remainingTime,
      remainingTimeSeconds: remainingSeconds,
      isTimeCritical: remainingSeconds < 30,
      isTimeWarning: remainingSeconds < 60,
      dps: ourPlayer.dps || 0,
      totalDamage: ourPlayer.totalDamage || 0,
      hps: ourPlayer.hps || 0,
      totalHeal: ourPlayer.totalHeal || 0,
      playerScores: playerScores,
      isPlayerDead: ourPlayer.stats.currentHp <= 0,
    };

    // Emit event for React to catch
    this.events.emit('gameStateUpdate', gameState);
  }
}

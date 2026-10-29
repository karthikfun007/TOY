/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Vector2D {
  x: number;
  y: number;
}

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export type CharacterId = 'dog' | 'robot' | 'crayon' | 'dino' | 'ballerina' | 'duck';

export interface CharacterInfo {
  id: CharacterId;
  name: string;
  title: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  description: string;
  stats?: {
    speed: number;
    weight: number;
    bounce: number;
    traction: number;
  };
}

export type TrapType =
  | 'spring'
  | 'slime'
  | 'fake_floor'
  | 'chomp_toy'
  | 'bubble_blower'
  | 'banana_peel';

export interface TrapAnchor {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  zone: string;
  description: string;
}

export interface PlacedTrap {
  id: string;
  anchorId?: string;
  type: TrapType;
  ownerId: string;
  ownerName: string;
  x: number;
  y: number;
  width: number;
  height: number;
  revealed: boolean;
  triggered: boolean;
  triggerCooldown: number; // ms
}

export interface Platform {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  type: 'solid' | 'one_way' | 'collapsing' | 'bounce' | 'shelf' | 'ice' | 'conveyor';
  color?: string;
  pattern?: 'wood' | 'block' | 'stripes' | 'metal' | 'stone' | 'ice' | 'obsidian' | 'neon' | 'candy' | 'cosmic';
  collapseTimer?: number;
  collapsed?: boolean;
  respawnTimer?: number;
  frictionModifier?: number; // e.g. 0.2 for slippery ice, 1.0 default
  conveyorSpeed?: number; // e.g. +120 or -120 px/s
}

export interface Checkpoint {
  id: number;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  respawnX: number;
  respawnY: number;
}

export type HazardType = 'train' | 'windup' | 'saw' | 'gear' | 'laser' | 'piston' | 'drone' | 'lava_surge';

export interface MovingHazard {
  id: string;
  type: HazardType;
  x: number;
  y: number;
  width: number;
  height: number;
  startX: number;
  endX: number;
  speed: number;
  direction: 1 | -1;
  color: string;
  axis?: 'horizontal' | 'vertical';
  startY?: number;
  endY?: number;
}

export type WorldTheme =
  | 'playground'
  | 'arcade_neon'
  | 'jungle'
  | 'candy'
  | 'frozen'
  | 'lava'
  | 'cosmic'
  | 'training'
  | 'industrial'
  | 'cyber';
export type WorldDifficulty = 'beginner' | 'moderate' | 'challenging' | 'expert' | 'master';

export interface WorldMetadata {
  id: string;
  worldNumber: number;
  name: string;
  subtitle: string;
  theme: WorldTheme;
  difficulty: WorldDifficulty;
  difficultyStars: number; // 1 to 5
  description: string;
  hazardsDescription: string;
  themeColor: string;
  accentColor: string;
  badgeIcon: string;
}

export interface LevelData {
  id: string;
  name: string;
  subtitle: string;
  width: number;
  height: number;
  deathY: number;
  spawns: { x: number; y: number }[];
  platforms: Platform[];
  checkpoints: Checkpoint[];
  movingHazards: MovingHazard[];
  trapAnchors: TrapAnchor[];
  finishTrigger: { x: number; y: number; width: number; height: number };
  worldNumber?: number;
  theme?: WorldTheme;
  difficulty?: WorldDifficulty;
  difficultyStars?: number;
  description?: string;
  hazardsDescription?: string;
  themeColor?: string;
  accentColor?: string;
  badgeIcon?: string;
  baseFrictionModifier?: number;
}

export interface WorldDefinition extends LevelData {
  worldNumber: number;
  theme: WorldTheme;
  difficulty: WorldDifficulty;
  difficultyStars: number;
  description: string;
  hazardsDescription: string;
  themeColor: string;
  accentColor: string;
  badgeIcon: string;
  baseFrictionModifier?: number;
}

export interface PlayerInput {
  left: boolean;
  right: boolean;
  jump: boolean;
  jumpPressed: boolean;
}

export interface PlayerState {
  id: string;
  name: string;
  characterId: CharacterId;
  colorVariant: number;
  isHost: boolean;
  isReady: boolean;
  isBot: boolean;

  // Physics & Transform
  x: number;
  y: number;
  vx: number;
  vy: number;
  facing: 1 | -1;
  isGrounded: boolean;
  isJumping: boolean;
  canDoubleJump?: boolean;
  coyoteTimer: number;
  jumpBufferTimer: number;

  // Visuals & Animation
  animFrame: number;
  squishX: number;
  squishY: number;
  runCycle: number;

  // Game Status
  lastCheckpointId: number;
  finished: boolean;
  finishTime: number | null;
  finishRank: number | null;
  respawnProtectionTimer: number;
  isRespawning: boolean;
  respawnTimer: number;

  // Status effects from traps
  statusEffect: 'none' | 'slimed' | 'launched' | 'dizzy' | 'bubbled' | 'slipping';
  statusTimer: number;

  // Match Scoring (5 rounds)
  roundPoints: number[];
  totalScore: number;
}

export type GamePhase =
  | 'title'
  | 'lobby'
  | 'world_transition'
  | 'trap_placement'
  | 'countdown'
  | 'racing'
  | 'round_results'
  | 'match_victory';

export interface SyncedHazardState {
  id: string;
  x: number;
  y: number;
  direction: 1 | -1;
}

export interface SyncedPlatformState {
  id: string;
  collapsed: boolean;
  collapseTimer?: number;
  respawnTimer?: number;
}

export interface RoomState {
  roomCode: string;
  hostId: string;
  phase: GamePhase;
  currentRound: number;
  totalRounds: number;
  countdownTimer: number;
  trapPhaseTimer: number;
  worldTransitionTimer?: number;
  roundStartTime: number;
  players: Record<string, PlayerState>;
  traps: PlacedTrap[];
  levelId: string;
  worldHistory?: string[];
  hazards?: SyncedHazardState[];
  platforms?: SyncedPlatformState[];
}


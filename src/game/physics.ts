/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { audio } from './audio';
import { LevelData } from './levelData';
import { PlacedTrap, Platform, PlayerInput, PlayerState } from './types';

export const PLAYER_HITBOX = {
  width: 24,
  height: 32,
  halfWidth: 12,
  halfHeight: 16,
};

export const PHYSICS_CONFIG = {
  maxSpeed: 270,
  maxSpeedSlimed: 95,
  accelGround: 1750,
  accelAir: 1100,
  frictionGround: 2100,
  frictionAir: 200,
  gravity: 1350,
  jumpSpeed: -520,
  bouncePadSpeed: -760,
  coyoteDuration: 0.12, // seconds
  jumpBufferDuration: 0.14,
};

/**
 * Updates moving hazards (trains, saws, gears, windup toys, drones) on the authoritative timeline
 */
export function updateMovingHazards(level: LevelData, dt: number) {
  for (const hazard of level.movingHazards) {
    if (hazard.axis === 'vertical' && hazard.startY !== undefined && hazard.endY !== undefined) {
      hazard.y += hazard.speed * hazard.direction * dt;
      if (hazard.y > hazard.endY) {
        hazard.y = hazard.endY;
        hazard.direction = -1;
      } else if (hazard.y < hazard.startY) {
        hazard.y = hazard.startY;
        hazard.direction = 1;
      }
    } else {
      hazard.x += hazard.speed * hazard.direction * dt;
      if (hazard.x > hazard.endX) {
        hazard.x = hazard.endX;
        hazard.direction = -1;
      } else if (hazard.x < hazard.startX) {
        hazard.x = hazard.startX;
        hazard.direction = 1;
      }
    }
  }
}

/**
 * Resets moving hazards back to their initial patrol points
 */
export function resetMovingHazards(level: LevelData) {
  for (const hazard of level.movingHazards) {
    hazard.x = hazard.startX;
    if (hazard.startY !== undefined) {
      hazard.y = hazard.startY;
    }
    hazard.direction = 1;
  }
}

/**
 * Resets collapsing platforms back to solid visible state
 */
export function resetPlatforms(level: LevelData) {
  for (const plat of level.platforms) {
    if (plat.type === 'collapsing') {
      plat.collapsed = false;
      plat.collapseTimer = undefined;
      plat.respawnTimer = undefined;
    }
  }
}

/**
 * Updates collapsing platforms (shakes then drops, then respawns)
 */
export function updateCollapsingPlatforms(level: LevelData, dt: number) {
  for (const plat of level.platforms) {
    if (plat.type === 'collapsing') {
      if (plat.collapseTimer !== undefined && plat.collapseTimer > 0) {
        plat.collapseTimer -= dt;
        if (plat.collapseTimer <= 0) {
          plat.collapsed = true;
          plat.respawnTimer = 3.5;
          audio.playFakeFloorCrumble();
        }
      } else if (plat.collapsed && plat.respawnTimer !== undefined) {
        plat.respawnTimer -= dt;
        if (plat.respawnTimer <= 0) {
          plat.collapsed = false;
          plat.collapseTimer = undefined;
          plat.respawnTimer = undefined;
        }
      }
    }
  }
}

/**
 * Updates individual player state for one physics step
 */
export function updatePlayerPhysics(
  player: PlayerState,
  input: PlayerInput,
  level: LevelData,
  traps: PlacedTrap[],
  dt: number,
  currentTime: number,
  onFinish?: (player: PlayerState) => void
) {
  // If player already finished or is respawning
  if (player.finished) {
    // Gentle friction stop
    player.vx *= Math.max(0, 1 - 5 * dt);
    player.x += player.vx * dt;
    return;
  }

  // Handle respawn protection & timers
  if (player.respawnProtectionTimer > 0) {
    player.respawnProtectionTimer -= dt;
  }

  // Handle status timers
  if (player.statusTimer > 0) {
    player.statusTimer -= dt;
    if (player.statusTimer <= 0) {
      if (player.statusEffect === 'bubbled') {
        audio.playBubblePop();
      }
      player.statusEffect = 'none';
    }
  }

  // Handle coyote time & jump buffer
  if (player.isGrounded) {
    player.coyoteTimer = PHYSICS_CONFIG.coyoteDuration;
  } else {
    player.coyoteTimer = Math.max(0, player.coyoteTimer - dt);
  }

  if (input.jumpPressed) {
    player.jumpBufferTimer = PHYSICS_CONFIG.jumpBufferDuration;
  } else {
    player.jumpBufferTimer = Math.max(0, player.jumpBufferTimer - dt);
  }

  const isSlimed = player.statusEffect === 'slimed';
  const isDizzy = player.statusEffect === 'dizzy';
  const isBubbled = player.statusEffect === 'bubbled';
  const isSlipping = player.statusEffect === 'slipping';

  // Check surface platform friction & conveyor motion
  const groundPlat = (player as any)._groundPlatform as Platform | undefined;
  let frictionModifier = 1.0;
  if (player.isGrounded) {
    if (groundPlat && (groundPlat.type === 'ice' || groundPlat.frictionModifier !== undefined)) {
      frictionModifier = groundPlat.frictionModifier ?? 0.22;
    } else if (level.baseFrictionModifier !== undefined) {
      frictionModifier = level.baseFrictionModifier;
    }

    if (groundPlat && groundPlat.type === 'conveyor' && groundPlat.conveyorSpeed) {
      player.x += groundPlat.conveyorSpeed * dt;
    }
  }

  let targetMaxSpeed = PHYSICS_CONFIG.maxSpeed;
  if (isSlimed) targetMaxSpeed = PHYSICS_CONFIG.maxSpeedSlimed;
  else if (isDizzy) targetMaxSpeed = 75;
  else if (isBubbled) targetMaxSpeed = 110;
  else if (isSlipping) targetMaxSpeed = 380;
  else if (frictionModifier < 0.4) targetMaxSpeed = 320; // faster top speed when drifting on ice!

  let accel = player.isGrounded ? PHYSICS_CONFIG.accelGround : PHYSICS_CONFIG.accelAir;
  if (frictionModifier < 0.4 && player.isGrounded) {
    accel = PHYSICS_CONFIG.accelGround * 0.45; // floaty drift acceleration
  }

  let friction = player.isGrounded
    ? PHYSICS_CONFIG.frictionGround * frictionModifier
    : PHYSICS_CONFIG.frictionAir;

  if (isSlipping && player.isGrounded) {
    friction = 90; // virtually frictionless slip
    accel = 300;
  }

  // Horizontal Movement
  let moveDir = 0;
  if (input.left) moveDir -= 1;
  if (input.right) moveDir += 1;

  if (isSlipping) {
    // Force continuous slide in facing direction
    player.vx = player.facing * Math.max(260, Math.abs(player.vx));
    player.runCycle += dt * 25;
    player.squishX = 1.35;
    player.squishY = 0.7;
  } else if (moveDir !== 0) {
    player.facing = moveDir > 0 ? 1 : -1;
    player.vx += moveDir * accel * dt;
    if (Math.abs(player.vx) > targetMaxSpeed) {
      player.vx = Math.sign(player.vx) * targetMaxSpeed;
    }
    player.runCycle += dt * 10 * (Math.abs(player.vx) / targetMaxSpeed);
  } else {
    // Apply friction
    if (Math.abs(player.vx) > 0) {
      const drop = friction * dt;
      if (Math.abs(player.vx) <= drop) {
        player.vx = 0;
      } else {
        player.vx -= Math.sign(player.vx) * drop;
      }
    }
    player.runCycle = 0;
  }

  // Jump execution (Coyote Time + Jump Buffer)
  const canJump = !isSlimed && !isDizzy && !isBubbled;
  if (canJump && player.jumpBufferTimer > 0 && player.coyoteTimer > 0 && !player.isJumping) {
    player.vy = PHYSICS_CONFIG.jumpSpeed;
    player.isGrounded = false;
    player.isJumping = true;
    player.coyoteTimer = 0;
    player.jumpBufferTimer = 0;
    player.squishX = 0.8;
    player.squishY = 1.35; // stretch on jump
    audio.playJump();
  }

  // Variable Jump Height (releasing jump button cuts rise early for great control)
  if (!input.jump && player.vy < -150) {
    player.vy *= 0.65;
  }

  // Gravity & Bubbled buoyancy
  if (isBubbled) {
    // Floating upward in soapy bubble!
    player.vy = Math.max(-130, player.vy - 750 * dt);
    player.squishX = 1.05 + Math.sin(player.statusTimer * 10) * 0.1;
    player.squishY = 1.05 - Math.sin(player.statusTimer * 10) * 0.1;
  } else {
    player.vy += PHYSICS_CONFIG.gravity * dt;
    if (player.vy > 800) player.vy = 800; // terminal velocity
  }

  // Pre-movement position
  const prevX = player.x;
  const prevY = player.y;

  // Move X & Resolve Solid Collisions
  player.x += player.vx * dt;
  resolveCollisionsX(player, prevX, level);

  // Move Y & Resolve Platform Collisions
  player.y += player.vy * dt;
  const wasGrounded = player.isGrounded;
  player.isGrounded = false;
  resolveCollisionsY(player, prevY, level);

  // Check landing sound & squish
  if (!wasGrounded && player.isGrounded) {
    player.squishX = 1.3;
    player.squishY = 0.75;
    player.isJumping = false;
    audio.playLand();
  }

  // Smooth squish & stretch recovery
  player.squishX += (1.0 - player.squishX) * Math.min(1, 14 * dt);
  player.squishY += (1.0 - player.squishY) * Math.min(1, 14 * dt);

  // Check Checkpoints
  checkPlayerCheckpoints(player, level);

  // Check Traps
  checkPlayerTraps(player, traps, dt);

  // Check Moving Hazards
  checkPlayerHazards(player, level);

  // Check Pit Fall (Death & Respawn)
  if (player.y > level.deathY) {
    respawnPlayerAtLastCheckpoint(player, level);
  }

  // Check Finish Trigger
  const ft = level.finishTrigger;
  if (
    !player.finished &&
    player.x + PLAYER_HITBOX.halfWidth >= ft.x &&
    player.x - PLAYER_HITBOX.halfWidth <= ft.x + ft.width &&
    player.y >= ft.y &&
    player.y <= ft.y + ft.height
  ) {
    player.finished = true;
    player.finishTime = currentTime;
    audio.playFinishHorn();
    if (onFinish) {
      onFinish(player);
    }
  }
}

function resolveCollisionsX(player: PlayerState, _prevX: number, level: LevelData) {
  const pLeft = player.x - PLAYER_HITBOX.halfWidth;
  const pRight = player.x + PLAYER_HITBOX.halfWidth;
  const pTop = player.y - PLAYER_HITBOX.height;
  const pBottom = player.y;

  // World boundaries
  if (pLeft < 0) {
    player.x = PLAYER_HITBOX.halfWidth;
    player.vx = 0;
    return;
  }
  if (pRight > level.width) {
    player.x = level.width - PLAYER_HITBOX.halfWidth;
    player.vx = 0;
    return;
  }

  for (const plat of level.platforms) {
    if (
      plat.type !== 'solid' &&
      plat.type !== 'shelf' &&
      plat.type !== 'ice' &&
      plat.type !== 'conveyor'
    )
      continue;
    if (plat.collapsed) continue;

    const platLeft = plat.x;
    const platRight = plat.x + plat.width;
    const platTop = plat.y;
    const platBottom = plat.y + plat.height;

    // Check overlap
    if (pRight > platLeft && pLeft < platRight && pBottom > platTop + 4 && pTop < platBottom - 4) {
      if (player.vx > 0) {
        player.x = platLeft - PLAYER_HITBOX.halfWidth;
        player.vx = 0;
      } else if (player.vx < 0) {
        player.x = platRight + PLAYER_HITBOX.halfWidth;
        player.vx = 0;
      }
    }
  }
}

function resolveCollisionsY(player: PlayerState, prevY: number, level: LevelData) {
  const pLeft = player.x - PLAYER_HITBOX.halfWidth + 2;
  const pRight = player.x + PLAYER_HITBOX.halfWidth - 2;
  const pTop = player.y - PLAYER_HITBOX.height;
  const pBottom = player.y;
  const prevBottom = prevY;

  (player as any)._groundPlatform = undefined;

  for (const plat of level.platforms) {
    if (plat.collapsed) continue;

    const platLeft = plat.x;
    const platRight = plat.x + plat.width;
    const platTop = plat.y;
    const platBottom = plat.y + plat.height;

    // Horizontal overlap check
    if (pRight <= platLeft || pLeft >= platRight) continue;

    // Landing on top of platform (downward velocity)
    if (player.vy >= 0 && prevBottom <= platTop + 8 && pBottom >= platTop) {
      if (plat.type === 'bounce') {
        // Catapult bounce pad!
        player.vy = PHYSICS_CONFIG.bouncePadSpeed;
        player.y = platTop;
        player.squishX = 0.7;
        player.squishY = 1.4;
        audio.playBouncePad();
        return;
      }

      // Normal landing
      player.y = platTop;
      player.vy = 0;
      player.isGrounded = true;
      (player as any)._groundPlatform = plat;

      if (plat.type === 'collapsing' && plat.collapseTimer === undefined) {
        plat.collapseTimer = 0.8; // begins shaking & will collapse
      }
      return;
    }

    // Ceiling hit on solid platforms
    if (
      (plat.type === 'solid' ||
        plat.type === 'shelf' ||
        plat.type === 'ice' ||
        plat.type === 'conveyor') &&
      player.vy < 0
    ) {
      if (pTop < platBottom && prevY - PLAYER_HITBOX.height >= platBottom - 6) {
        player.y = platBottom + PLAYER_HITBOX.height;
        player.vy = 0;
      }
    }
  }
}

function checkPlayerCheckpoints(player: PlayerState, level: LevelData) {
  for (const cp of level.checkpoints) {
    if (cp.id <= player.lastCheckpointId) continue;

    // Check bounding box
    if (
      player.x >= cp.x &&
      player.x <= cp.x + cp.width &&
      player.y >= cp.y &&
      player.y <= cp.y + cp.height + 40
    ) {
      player.lastCheckpointId = cp.id;
      audio.playCheckpoint();
    }
  }
}

function checkPlayerTraps(player: PlayerState, traps: PlacedTrap[], _dt: number) {
  if (player.respawnProtectionTimer > 0) return;

  const pLeft = player.x - PLAYER_HITBOX.halfWidth;
  const pRight = player.x + PLAYER_HITBOX.halfWidth;
  const pTop = player.y - PLAYER_HITBOX.height;
  const pBottom = player.y;

  for (const trap of traps) {
    if (trap.triggerCooldown > 0) {
      trap.triggerCooldown -= _dt;
      continue;
    }

    // Overlap test
    if (
      pRight > trap.x &&
      pLeft < trap.x + trap.width &&
      pBottom >= trap.y &&
      pTop <= trap.y + trap.height
    ) {
      // Trigger Trap!
      trap.triggered = true;
      trap.triggerCooldown = 1.8; // cooldown before re-triggering

      if (trap.type === 'spring') {
        player.vy = -540;
        player.vx = -player.facing * 360;
        player.statusEffect = 'launched';
        player.statusTimer = 1.2;
        player.squishX = 1.5;
        player.squishY = 0.6;
        audio.playTrapSpring();
      } else if (trap.type === 'slime') {
        player.statusEffect = 'slimed';
        player.statusTimer = 2.4;
        audio.playSlimeSplat();
      } else if (trap.type === 'fake_floor') {
        // Player plummets through floor
        player.vy = 300;
        audio.playFakeFloorCrumble();
      } else if (trap.type === 'chomp_toy') {
        // Snaps racer into a dizzy backward spin
        player.statusEffect = 'dizzy';
        player.statusTimer = 1.8;
        player.vx = -player.facing * 200;
        player.vy = -260;
        player.squishX = 1.4;
        player.squishY = 0.6;
        audio.playChomp();
      } else if (trap.type === 'bubble_blower') {
        // Traps racer in floating bubble
        player.statusEffect = 'bubbled';
        player.statusTimer = 1.8;
        player.vy = -240;
        player.isGrounded = false;
        audio.playBubbleTrap();
      } else if (trap.type === 'banana_peel') {
        // Slipping slide at high speed
        player.statusEffect = 'slipping';
        player.statusTimer = 1.5;
        player.vx = player.facing * 390;
        player.vy = -120;
        player.squishX = 1.6;
        player.squishY = 0.5;
        audio.playSlipSlide();
      }
    }
  }
}

function checkPlayerHazards(player: PlayerState, level: LevelData) {
  if (player.respawnProtectionTimer > 0) return;

  const pLeft = player.x - PLAYER_HITBOX.halfWidth;
  const pRight = player.x + PLAYER_HITBOX.halfWidth;
  const pTop = player.y - PLAYER_HITBOX.height;
  const pBottom = player.y;

  for (const hazard of level.movingHazards) {
    const hLeft = hazard.x;
    const hRight = hazard.x + hazard.width;
    const hTop = hazard.y;
    const hBottom = hazard.y + hazard.height;

    if (pRight > hLeft && pLeft < hRight && pBottom > hTop && pTop < hBottom) {
      // Hilarious setback! Knocked back and up depending on hazard type
      const dir = hazard.direction || 1;
      player.vx = -dir * 360;
      player.vy = -430;
      player.respawnProtectionTimer = 0.9;
      player.squishX = 1.45;
      player.squishY = 0.65;

      if (hazard.type === 'train') {
        audio.playTrainWhistle();
      } else if (hazard.type === 'gear' || hazard.type === 'windup') {
        player.statusEffect = 'dizzy';
        player.statusTimer = 1.2;
        audio.playChomp();
      } else if (hazard.type === 'saw' || hazard.type === 'lava_surge') {
        player.vy = -470;
        player.vx = -dir * 400;
        audio.playTrapSpring();
      } else if (hazard.type === 'laser') {
        player.vy = -450;
        audio.playCountdownBeep(true);
      } else if (hazard.type === 'drone') {
        audio.playTrapSpring();
      } else {
        audio.playTrapSpring();
      }
    }
  }
}

export function respawnPlayerAtLastCheckpoint(player: PlayerState, level: LevelData) {
  const cp =
    level.checkpoints.find((c) => c.id === player.lastCheckpointId) || level.checkpoints[0];
  player.x = cp.respawnX;
  player.y = cp.respawnY;
  player.vx = 0;
  player.vy = 0;
  player.isGrounded = true;
  player.isJumping = false;
  player.statusEffect = 'none';
  player.statusTimer = 0;
  player.respawnProtectionTimer = 1.5; // invulnerable flash
  player.squishX = 1.0;
  player.squishY = 1.0;
}

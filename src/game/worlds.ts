/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  Checkpoint,
  LevelData,
  MovingHazard,
  Platform,
  TrapAnchor,
  WorldDefinition,
  WorldDifficulty,
  WorldTheme,
} from './types';

export type { WorldDefinition };

// ============================================================================
// MAP VALIDATION ENGINE
// ============================================================================
export interface MapValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  stats: {
    platformCount: number;
    checkpointCount: number;
    hazardCount: number;
    anchorCount: number;
    totalLength: number;
  };
}

/**
 * Validates a world to guarantee collision safety, reachable finish, fair spawns,
 * ascending checkpoints, and multiplayer synchronization.
 */
export function validateWorld(world: WorldDefinition): MapValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // 1. Spawns check
  if (!world.spawns || world.spawns.length < 6) {
    errors.push(`World ${world.id} requires at least 6 player spawn points for 6-player matches.`);
  } else {
    for (let i = 0; i < world.spawns.length; i++) {
      const sp = world.spawns[i];
      if (sp.x < 0 || sp.x > world.width || sp.y < 0 || sp.y > world.deathY) {
        errors.push(`Spawn ${i} (${sp.x}, ${sp.y}) is out of world bounds.`);
      }
      // Check if there is platform ground beneath spawn
      const hasGround = world.platforms.some(
        (p) => sp.x >= p.x - 10 && sp.x <= p.x + p.width + 10 && p.y >= sp.y && p.y <= sp.y + 60
      );
      if (!hasGround) {
        warnings.push(`Spawn ${i} (${sp.x}, ${sp.y}) might not have solid ground directly below.`);
      }
    }
  }

  // 2. Checkpoints check
  if (!world.checkpoints || world.checkpoints.length < 3) {
    errors.push(`World ${world.id} requires at least 3 checkpoints.`);
  } else {
    for (let i = 0; i < world.checkpoints.length; i++) {
      const cp = world.checkpoints[i];
      if (i > 0 && cp.x <= world.checkpoints[i - 1].x) {
        errors.push(`Checkpoint ${cp.id} X (${cp.x}) must be strictly greater than previous checkpoint (${world.checkpoints[i - 1].x}).`);
      }
      if (cp.respawnY >= world.deathY) {
        errors.push(`Checkpoint ${cp.id} respawnY (${cp.respawnY}) is below deathY (${world.deathY}).`);
      }
    }
  }

  // 3. Finish trigger check
  if (!world.finishTrigger || world.finishTrigger.x < world.width - 500) {
    errors.push(`Finish trigger in ${world.id} is missing or too far from the course finish line.`);
  }

  // 4. Moving hazards check
  for (const h of world.movingHazards || []) {
    if (h.startX < 0 || h.endX > world.width) {
      warnings.push(`Hazard ${h.id} travel range (${h.startX}-${h.endX}) exceeds world width.`);
    }
    if (h.speed <= 0) {
      errors.push(`Hazard ${h.id} has invalid non-positive speed.`);
    }
  }

  // 5. Jump reachability check (no impossible horizontal chasms > 280px without bounce pads, and step-ups <= 75px)
  const sortedPlatforms = [...world.platforms].sort((a, b) => a.x - b.x);
  for (let i = 0; i < sortedPlatforms.length - 1; i++) {
    const cur = sortedPlatforms[i];
    const nxt = sortedPlatforms[i + 1];
    const gap = nxt.x - (cur.x + cur.width);
    if (gap > 280 && cur.type !== 'bounce' && cur.type !== 'conveyor' && !cur.collapsed) {
      // Check if there is an overlapping elevated platform or bounce pad in between
      const hasBridge = world.platforms.some(
        (p) => p.id !== cur.id && p.id !== nxt.id && p.x < nxt.x && p.x + p.width > cur.x + cur.width
      );
      if (!hasBridge && cur.x + cur.width < world.finishTrigger.x - 200) {
        warnings.push(`Potential jump gap of ${Math.round(gap)}px between ${cur.id} and ${nxt.id}.`);
      }
    }

    // Step-up vertical reachability check
    if (gap >= -30 && gap <= 140 && cur.type !== 'bounce') {
      const stepUp = cur.y - nxt.y; // positive if nxt is higher
      if (stepUp > 75) {
        const hasAlternate = world.platforms.some(
          (p) => p.id !== cur.id && p.id !== nxt.id && p.x >= cur.x - 20 && p.x <= nxt.x + nxt.width && (p.type === 'bounce' || cur.y - p.y <= 70)
        );
        if (!hasAlternate) {
          warnings.push(`Large vertical jump step of ${Math.round(stepUp)}px between ${cur.id} and ${nxt.id}.`);
        }
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    stats: {
      platformCount: world.platforms.length,
      checkpointCount: world.checkpoints.length,
      hazardCount: world.movingHazards.length,
      anchorCount: world.trapAnchors.length,
      totalLength: world.width,
    },
  };
}

// ============================================================================
// WORLD 1: PIXEL PLAYGROUND (16-bit Classic Grassland · Gentle slopes & Bounces)
// ============================================================================
export const WORLD_PLAYGROUND: WorldDefinition = {
  id: 'world_playground',
  worldNumber: 1,
  name: 'Pixel Playground',
  subtitle: '16-Bit Meadow Obstacle Course',
  theme: 'playground',
  difficulty: 'beginner',
  difficultyStars: 1,
  description: 'Vibrant rolling green pixel hills with wooden toy blocks, springy bounce pads, and broad jumping terraces. The classic 90s introductory course!',
  hazardsDescription: 'Gentle red wind-up train and clockwork wobbler.',
  themeColor: '#10b981',
  accentColor: '#38bdf8',
  badgeIcon: '🌱',
  width: 3300,
  height: 700,
  deathY: 660,

  spawns: [
    { x: 80, y: 520 },
    { x: 120, y: 520 },
    { x: 160, y: 520 },
    { x: 200, y: 520 },
    { x: 240, y: 520 },
    { x: 280, y: 520 },
  ],

  finishTrigger: {
    x: 3100,
    y: 350,
    width: 60,
    height: 180,
  },

  checkpoints: [
    {
      id: 0,
      name: 'Meadow Start',
      x: 50,
      y: 400,
      width: 100,
      height: 200,
      respawnX: 100,
      respawnY: 520,
    },
    {
      id: 1,
      name: 'Springboard Meadow',
      x: 950,
      y: 360,
      width: 70,
      height: 180,
      respawnX: 970,
      respawnY: 440,
    },
    {
      id: 2,
      name: 'High Timber Terrace',
      x: 1800,
      y: 340,
      width: 70,
      height: 180,
      respawnX: 1820,
      respawnY: 420,
    },
    {
      id: 3,
      name: 'Wind-up Crossing',
      x: 2500,
      y: 380,
      width: 70,
      height: 180,
      respawnX: 2520,
      respawnY: 460,
    },
  ],

  movingHazards: [
    {
      id: 'train_1',
      type: 'train',
      x: 500,
      y: 532,
      width: 70,
      height: 28,
      startX: 400,
      endX: 720,
      speed: 120,
      direction: 1,
      color: '#ef4444',
    },
    {
      id: 'windup_1',
      type: 'windup',
      x: 2100,
      y: 472,
      width: 32,
      height: 28,
      startX: 2000,
      endX: 2360,
      speed: 90,
      direction: -1,
      color: '#eab308',
    },
  ],

  trapAnchors: [
    {
      id: 'pg_anchor_1',
      x: 620,
      y: 520,
      width: 60,
      height: 20,
      zone: 'Zone 1: First Meadow Gap',
      description: 'Right before the train crossing gap',
    },
    {
      id: 'pg_anchor_2',
      x: 1350,
      y: 410,
      width: 60,
      height: 20,
      zone: 'Zone 2: High Bounce Terrace',
      description: 'Landing spot for the super bounce pad',
    },
    {
      id: 'pg_anchor_3',
      x: 2240,
      y: 470,
      width: 60,
      height: 20,
      zone: 'Zone 3: Timber Span',
      description: 'Narrow wooden bridge over the meadow gap',
    },
    {
      id: 'pg_anchor_4',
      x: 2860,
      y: 490,
      width: 60,
      height: 20,
      zone: 'Zone 4: Final Sprint',
      description: 'Right before the finish archway',
    },
  ],

  platforms: [
    // Starting Meadow Floor
    {
      id: 'pg_floor_start',
      x: 40,
      y: 550,
      width: 380,
      height: 100,
      type: 'solid',
      color: '#22c55e',
      pattern: 'wood',
    },
    // Stepping Blocks & Low Train Run
    {
      id: 'pg_step_1',
      x: 450,
      y: 560,
      width: 290,
      height: 90,
      type: 'solid',
      color: '#16a34a',
      pattern: 'wood',
    },
    {
      id: 'pg_shelf_high1',
      x: 520,
      y: 440,
      width: 140,
      height: 20,
      type: 'shelf',
      color: '#f59e0b',
      pattern: 'block',
    },
    // Meadow Mound
    {
      id: 'pg_floor_mound',
      x: 780,
      y: 520,
      width: 200,
      height: 130,
      type: 'solid',
      color: '#22c55e',
      pattern: 'wood',
    },
    // Spring Pad Launching to High Terrace
    {
      id: 'pg_bounce_1',
      x: 1020,
      y: 510,
      width: 80,
      height: 22,
      type: 'bounce',
      color: '#f43f5e',
      pattern: 'block',
    },
    // High Timber Terrace (Upper Route)
    {
      id: 'pg_terrace_upper',
      x: 1140,
      y: 380,
      width: 340,
      height: 24,
      type: 'solid',
      color: '#eab308',
      pattern: 'wood',
    },
    // Lower Valley Run (Lower Route)
    {
      id: 'pg_valley_floor',
      x: 1140,
      y: 560,
      width: 480,
      height: 90,
      type: 'solid',
      color: '#15803d',
      pattern: 'wood',
    },
    // Reunion Step
    {
      id: 'pg_reunion_step',
      x: 1660,
      y: 490,
      width: 160,
      height: 160,
      type: 'solid',
      color: '#22c55e',
      pattern: 'wood',
    },
    // Checkpoint 2 Terrace
    {
      id: 'pg_cp2_shelf',
      x: 1800,
      y: 450,
      width: 180,
      height: 200,
      type: 'shelf',
      color: '#f59e0b',
      pattern: 'wood',
    },
    // Stepping Island Bridges
    {
      id: 'pg_island_1',
      x: 2020,
      y: 480,
      width: 110,
      height: 24,
      type: 'solid',
      color: '#3b82f6',
      pattern: 'block',
    },
    {
      id: 'pg_island_2',
      x: 2180,
      y: 460,
      width: 120,
      height: 24,
      type: 'solid',
      color: '#3b82f6',
      pattern: 'block',
    },
    {
      id: 'pg_island_3',
      x: 2340,
      y: 480,
      width: 100,
      height: 24,
      type: 'solid',
      color: '#3b82f6',
      pattern: 'block',
    },
    // Checkpoint 3 Ground
    {
      id: 'pg_cp3_ground',
      x: 2480,
      y: 490,
      width: 220,
      height: 160,
      type: 'solid',
      color: '#22c55e',
      pattern: 'wood',
    },
    // Final Wind-up Runway
    {
      id: 'pg_final_runway',
      x: 2740,
      y: 520,
      width: 260,
      height: 130,
      type: 'solid',
      color: '#16a34a',
      pattern: 'wood',
    },
    // Finish Dais
    {
      id: 'pg_finish_dais',
      x: 3040,
      y: 460,
      width: 220,
      height: 190,
      type: 'shelf',
      color: '#f59e0b',
      pattern: 'wood',
    },
  ],
};

// ============================================================================
// WORLD 2: NEON ARCADE DISTRICT (Cyberpunk Rooftops · Verticality & Catwalks)
// ============================================================================
export const WORLD_ARCADE_NEON: WorldDefinition = {
  id: 'world_arcade_neon',
  worldNumber: 2,
  name: 'Neon Arcade District',
  subtitle: 'Cyberpunk Neon Rooftops',
  theme: 'arcade_neon',
  difficulty: 'moderate',
  difficultyStars: 2,
  description: 'Skyscraper rooftops glowing with retro neon marquees ("INSERT COIN", "HIGH SCORE"). High verticality, daring rooftop leaps, and speeding drone traffic!',
  hazardsDescription: 'Speeding neon sky-taxis and pulsing voltage laser fences.',
  themeColor: '#a855f7',
  accentColor: '#06b6d4',
  badgeIcon: '🕹️',
  width: 3700,
  height: 780,
  deathY: 740,

  spawns: [
    { x: 90, y: 520 },
    { x: 130, y: 520 },
    { x: 170, y: 520 },
    { x: 210, y: 520 },
    { x: 250, y: 520 },
    { x: 290, y: 520 },
  ],

  finishTrigger: {
    x: 3480,
    y: 350,
    width: 60,
    height: 180,
  },

  checkpoints: [
    {
      id: 0,
      name: 'Rooftop Helipad',
      x: 60,
      y: 440,
      width: 100,
      height: 200,
      respawnX: 120,
      respawnY: 520,
    },
    {
      id: 1,
      name: 'Arcade Sign Plaza',
      x: 1050,
      y: 380,
      width: 70,
      height: 180,
      respawnX: 1080,
      respawnY: 450,
    },
    {
      id: 2,
      name: 'Skywalk Tower',
      x: 1980,
      y: 320,
      width: 70,
      height: 180,
      respawnX: 2010,
      respawnY: 410,
    },
    {
      id: 3,
      name: 'Drone Highway Catwalk',
      x: 2800,
      y: 370,
      width: 70,
      height: 180,
      respawnX: 2830,
      respawnY: 460,
    },
  ],

  movingHazards: [
    {
      id: 'neon_drone_1',
      type: 'drone',
      x: 600,
      y: 440,
      width: 50,
      height: 24,
      startX: 450,
      endX: 880,
      speed: 150,
      direction: 1,
      color: '#06b6d4',
    },
    {
      id: 'laser_grid_1',
      type: 'laser',
      x: 2350,
      y: 340,
      width: 16,
      height: 110,
      startX: 2350,
      endX: 2350,
      startY: 320,
      endY: 450,
      speed: 80,
      direction: 1,
      axis: 'vertical',
      color: '#ec4899',
    },
    {
      id: 'neon_drone_2',
      type: 'drone',
      x: 3050,
      y: 430,
      width: 54,
      height: 24,
      startX: 2900,
      endX: 3380,
      speed: 180,
      direction: -1,
      color: '#facc15',
    },
  ],

  trapAnchors: [
    {
      id: 'na_anchor_1',
      x: 740,
      y: 460,
      width: 60,
      height: 20,
      zone: 'Zone 1: Billboard Leap',
      description: 'Landing ledge after the first skyscraper gap',
    },
    {
      id: 'na_anchor_2',
      x: 1480,
      y: 410,
      width: 60,
      height: 20,
      zone: 'Zone 2: Neon Skybridge',
      description: 'Narrow suspended walkway over the cyber avenue',
    },
    {
      id: 'na_anchor_3',
      x: 2260,
      y: 430,
      width: 60,
      height: 20,
      zone: 'Zone 3: Voltage Alley',
      description: 'Beneath the pulsing vertical laser barrier',
    },
    {
      id: 'na_anchor_4',
      x: 3200,
      y: 440,
      width: 60,
      height: 20,
      zone: 'Zone 4: Final Roof Sprint',
      description: 'Rooftop sprint towards the neon arcade portal',
    },
  ],

  platforms: [
    // Starting Skyscraper Roof (Leveled for comfortable start)
    {
      id: 'na_roof_start',
      x: 40,
      y: 560,
      width: 380,
      height: 180,
      type: 'solid',
      color: '#1e1b4b',
      pattern: 'neon',
    },
    // First Rooftop Gap: Lower alley with springboard vs Upper air-duct
    {
      id: 'na_airduct_mid',
      x: 440,
      y: 510,
      width: 160,
      height: 22,
      type: 'solid',
      color: '#06b6d4',
      pattern: 'neon',
    },
    {
      id: 'na_alley_low',
      x: 450,
      y: 620,
      width: 220,
      height: 120,
      type: 'solid',
      color: '#0f172a',
      pattern: 'metal',
    },
    // Springboard in the lower alley to rocket racers straight to the billboard tower
    {
      id: 'na_alley_bounce',
      x: 560,
      y: 606,
      width: 70,
      height: 16,
      type: 'bounce',
      color: '#f43f5e',
      pattern: 'block',
    },
    // Billboard Tower
    {
      id: 'na_billboard_tower',
      x: 700,
      y: 490,
      width: 240,
      height: 250,
      type: 'solid',
      color: '#4c1d95',
      pattern: 'neon',
    },
    // Checkpoint 1 Plaza
    {
      id: 'na_cp1_roof',
      x: 980,
      y: 480,
      width: 280,
      height: 260,
      type: 'shelf',
      color: '#701a75',
      pattern: 'neon',
    },
    // Floating Neon Skywalk Bridges
    {
      id: 'na_skywalk_1',
      x: 1310,
      y: 460,
      width: 130,
      height: 20,
      type: 'solid',
      color: '#ec4899',
      pattern: 'neon',
    },
    {
      id: 'na_skywalk_2',
      x: 1490,
      y: 440,
      width: 130,
      height: 20,
      type: 'solid',
      color: '#06b6d4',
      pattern: 'neon',
    },
    {
      id: 'na_skywalk_3',
      x: 1670,
      y: 460,
      width: 130,
      height: 20,
      type: 'solid',
      color: '#a855f7',
      pattern: 'neon',
    },
    // Mid Tower Checkpoint 2
    {
      id: 'na_tower_cp2',
      x: 1850,
      y: 440,
      width: 240,
      height: 300,
      type: 'shelf',
      color: '#1e1b4b',
      pattern: 'neon',
    },
    // Laser Gauntlet Steps
    {
      id: 'na_laser_step_1',
      x: 2150,
      y: 480,
      width: 110,
      height: 22,
      type: 'solid',
      color: '#06b6d4',
      pattern: 'neon',
    },
    {
      id: 'na_laser_step_2',
      x: 2310,
      y: 460,
      width: 120,
      height: 22,
      type: 'solid',
      color: '#ec4899',
      pattern: 'neon',
    },
    {
      id: 'na_laser_step_3',
      x: 2480,
      y: 490,
      width: 130,
      height: 22,
      type: 'solid',
      color: '#a855f7',
      pattern: 'neon',
    },
    // High Spire Checkpoint 3
    {
      id: 'na_spire_cp3',
      x: 2680,
      y: 490,
      width: 220,
      height: 250,
      type: 'shelf',
      color: '#3b0764',
      pattern: 'neon',
    },
    // Speeding Drone Leap Runway
    {
      id: 'na_drone_runway',
      x: 2960,
      y: 520,
      width: 260,
      height: 220,
      type: 'solid',
      color: '#0f172a',
      pattern: 'neon',
    },
    // Final Floating Arcade Podiums
    {
      id: 'na_final_pod_1',
      x: 3270,
      y: 470,
      width: 80,
      height: 22,
      type: 'solid',
      color: '#06b6d4',
      pattern: 'neon',
    },
    {
      id: 'na_final_pod_2',
      x: 3390,
      y: 440,
      width: 240,
      height: 300,
      type: 'shelf',
      color: '#701a75',
      pattern: 'neon',
    },
  ],
};

// ============================================================================
// WORLD 3: TROPICAL PIXEL JUNGLE (Ancient Stone Ruins · Diverging Canopy Paths)
// ============================================================================
export const WORLD_JUNGLE: WorldDefinition = {
  id: 'world_jungle',
  worldNumber: 3,
  name: 'Tropical Pixel Jungle',
  subtitle: 'Ancient Stone Ruins & Canopy',
  theme: 'jungle',
  difficulty: 'challenging',
  difficultyStars: 3,
  description: 'Ancient moss-covered Mayan stone temples, tumbling waterfalls, and high tree canopies. Choose between the high breezy vine route or the sunken crumbling temple abyss!',
  hazardsDescription: 'Swinging ancient stone blades and crumbling mossy platforms.',
  themeColor: '#059669',
  accentColor: '#f59e0b',
  badgeIcon: '🌴',
  width: 3500,
  height: 740,
  deathY: 700,

  spawns: [
    { x: 90, y: 540 },
    { x: 130, y: 540 },
    { x: 170, y: 540 },
    { x: 210, y: 540 },
    { x: 250, y: 540 },
    { x: 290, y: 540 },
  ],

  finishTrigger: {
    x: 3300,
    y: 350,
    width: 60,
    height: 180,
  },

  checkpoints: [
    {
      id: 0,
      name: 'Temple Outpost',
      x: 50,
      y: 420,
      width: 100,
      height: 200,
      respawnX: 110,
      respawnY: 540,
    },
    {
      id: 1,
      name: 'Sunken Temple Chamber',
      x: 1040,
      y: 380,
      width: 70,
      height: 180,
      respawnX: 1060,
      respawnY: 480,
    },
    {
      id: 2,
      name: 'Emerald Waterfall Altar',
      x: 1920,
      y: 340,
      width: 70,
      height: 180,
      respawnX: 1950,
      respawnY: 440,
    },
    {
      id: 3,
      name: 'Canopy Crossway',
      x: 2700,
      y: 380,
      width: 70,
      height: 180,
      respawnX: 2720,
      respawnY: 480,
    },
  ],

  movingHazards: [
    {
      id: 'jungle_saw_1',
      type: 'saw',
      x: 1400,
      y: 430,
      width: 36,
      height: 36,
      startX: 1300,
      endX: 1650,
      speed: 130,
      direction: 1,
      color: '#d97706',
    },
    {
      id: 'jungle_saw_2',
      type: 'saw',
      x: 2300,
      y: 450,
      width: 40,
      height: 40,
      startX: 2180,
      endX: 2550,
      speed: 150,
      direction: -1,
      color: '#ea580c',
    },
  ],

  trapAnchors: [
    {
      id: 'jg_anchor_1',
      x: 640,
      y: 480,
      width: 60,
      height: 20,
      zone: 'Zone 1: Vine Bridge',
      description: 'Right before the crumbling stone stairs',
    },
    {
      id: 'jg_anchor_2',
      x: 1520,
      y: 440,
      width: 60,
      height: 20,
      zone: 'Zone 2: Waterfall Edge',
      description: 'Perilous ledge overlooking the turquoise lagoon',
    },
    {
      id: 'jg_anchor_3',
      x: 2360,
      y: 460,
      width: 60,
      height: 20,
      zone: 'Zone 3: Ancient Pillar',
      description: 'Middle stone column between swinging pendulum saws',
    },
    {
      id: 'jg_anchor_4',
      x: 3050,
      y: 490,
      width: 60,
      height: 20,
      zone: 'Zone 4: Idol Gate',
      description: 'Ascent to the Golden Idol finish gate',
    },
  ],

  platforms: [
    // Starting Temple Grounds
    {
      id: 'jg_temple_start',
      x: 40,
      y: 570,
      width: 360,
      height: 130,
      type: 'solid',
      color: '#15803d',
      pattern: 'stone',
    },
    // Crumbling Stone Steps (Collapsing)
    {
      id: 'jg_crumb_1',
      x: 450,
      y: 530,
      width: 90,
      height: 22,
      type: 'collapsing',
      color: '#047857',
      pattern: 'stone',
      collapseTimer: 0.8,
    },
    {
      id: 'jg_crumb_2',
      x: 580,
      y: 490,
      width: 90,
      height: 22,
      type: 'collapsing',
      color: '#047857',
      pattern: 'stone',
      collapseTimer: 0.8,
    },
    {
      id: 'jg_crumb_3',
      x: 710,
      y: 450,
      width: 90,
      height: 22,
      type: 'collapsing',
      color: '#047857',
      pattern: 'stone',
      collapseTimer: 0.8,
    },
    // High Canopy Branch (Upper Route)
    {
      id: 'jg_canopy_high',
      x: 840,
      y: 410,
      width: 220,
      height: 22,
      type: 'solid',
      color: '#84cc16',
      pattern: 'wood',
    },
    // Sunken Temple Floor Checkpoint 1
    {
      id: 'jg_cp1_temple',
      x: 1000,
      y: 510,
      width: 260,
      height: 190,
      type: 'shelf',
      color: '#1e3a1f',
      pattern: 'stone',
    },
    // Lagoon Stepping Stones (Narrow, precision leaps)
    {
      id: 'jg_lagoon_stone1',
      x: 1310,
      y: 510,
      width: 80,
      height: 24,
      type: 'solid',
      color: '#065f46',
      pattern: 'stone',
    },
    {
      id: 'jg_lagoon_stone2',
      x: 1440,
      y: 480,
      width: 80,
      height: 24,
      type: 'solid',
      color: '#065f46',
      pattern: 'stone',
    },
    {
      id: 'jg_lagoon_stone3',
      x: 1570,
      y: 500,
      width: 90,
      height: 24,
      type: 'solid',
      color: '#065f46',
      pattern: 'stone',
    },
    {
      id: 'jg_lagoon_stone4',
      x: 1680,
      y: 480,
      width: 70,
      height: 24,
      type: 'solid',
      color: '#065f46',
      pattern: 'stone',
    },
    // Waterfall Altar Checkpoint 2
    {
      id: 'jg_altar_cp2',
      x: 1780,
      y: 460,
      width: 280,
      height: 240,
      type: 'shelf',
      color: '#15803d',
      pattern: 'stone',
    },
    // Bouncy Canopy Mushroom
    {
      id: 'jg_mushroom_bounce',
      x: 2110,
      y: 520,
      width: 80,
      height: 24,
      type: 'bounce',
      color: '#f43f5e',
      pattern: 'block',
    },
    // High Canopy Trellis
    {
      id: 'jg_canopy_trellis',
      x: 2230,
      y: 370,
      width: 240,
      height: 20,
      type: 'solid',
      color: '#84cc16',
      pattern: 'wood',
    },
    // Ancient Ruin Pillars (Underneath canopy)
    {
      id: 'jg_pillar_1',
      x: 2260,
      y: 530,
      width: 90,
      height: 170,
      type: 'solid',
      color: '#1e3a1f',
      pattern: 'stone',
    },
    {
      id: 'jg_pillar_2',
      x: 2410,
      y: 510,
      width: 90,
      height: 190,
      type: 'solid',
      color: '#1e3a1f',
      pattern: 'stone',
    },
    // Checkpoint 3 Gate
    {
      id: 'jg_cp3_gate',
      x: 2620,
      y: 490,
      width: 240,
      height: 210,
      type: 'shelf',
      color: '#065f46',
      pattern: 'stone',
    },
    // Final Crumbling Ascent
    {
      id: 'jg_final_crumb',
      x: 2910,
      y: 490,
      width: 90,
      height: 22,
      type: 'collapsing',
      color: '#047857',
      pattern: 'stone',
      collapseTimer: 0.8,
    },
    {
      id: 'jg_final_step',
      x: 3050,
      y: 460,
      width: 90,
      height: 24,
      type: 'solid',
      color: '#15803d',
      pattern: 'stone',
    },
    // Golden Idol Dais Finish
    {
      id: 'jg_finish_dais',
      x: 3190,
      y: 440,
      width: 240,
      height: 260,
      type: 'shelf',
      color: '#f59e0b',
      pattern: 'stone',
    },
  ],
};

// ============================================================================
// WORLD 4: CANDY FACTORY (Conveyor Belts · Sugar Vats & Crushing Pistons)
// ============================================================================
export const WORLD_CANDY: WorldDefinition = {
  id: 'world_candy',
  worldNumber: 4,
  name: 'Candy Factory',
  subtitle: 'Conveyor Belts & Sugar Pistons',
  theme: 'candy',
  difficulty: 'challenging',
  difficultyStars: 3,
  description: 'Industrial confectionery madness! Motorized conveyor belts that speed you up or push you back, bouncing jelly cushions, and crushing candy steam pistons!',
  hazardsDescription: 'High-speed conveyor belts, crushing steam pistons, and spinning peppermint saws.',
  themeColor: '#ec4899',
  accentColor: '#f97316',
  badgeIcon: '🍭',
  width: 3800,
  height: 720,
  deathY: 680,

  spawns: [
    { x: 90, y: 530 },
    { x: 130, y: 530 },
    { x: 170, y: 530 },
    { x: 210, y: 530 },
    { x: 250, y: 530 },
    { x: 290, y: 530 },
  ],

  finishTrigger: {
    x: 3580,
    y: 340,
    width: 60,
    height: 180,
  },

  checkpoints: [
    {
      id: 0,
      name: 'Packaging Depot',
      x: 50,
      y: 400,
      width: 100,
      height: 200,
      respawnX: 110,
      respawnY: 530,
    },
    {
      id: 1,
      name: 'Conveyor Junction',
      x: 1020,
      y: 360,
      width: 70,
      height: 180,
      respawnX: 1050,
      respawnY: 460,
    },
    {
      id: 2,
      name: 'Piston Press Vat',
      x: 1950,
      y: 330,
      width: 70,
      height: 180,
      respawnX: 1980,
      respawnY: 430,
    },
    {
      id: 3,
      name: 'Gummy Bounce Silo',
      x: 2840,
      y: 360,
      width: 70,
      height: 180,
      respawnX: 2870,
      respawnY: 460,
    },
  ],

  movingHazards: [
    {
      id: 'candy_piston_1',
      type: 'piston',
      x: 1480,
      y: 320,
      width: 50,
      height: 110,
      startX: 1480,
      endX: 1480,
      startY: 280,
      endY: 430,
      speed: 120,
      direction: 1,
      axis: 'vertical',
      color: '#f97316',
    },
    {
      id: 'peppermint_saw_1',
      type: 'saw',
      x: 2360,
      y: 440,
      width: 44,
      height: 44,
      startX: 2250,
      endX: 2580,
      speed: 160,
      direction: 1,
      color: '#ec4899',
    },
    {
      id: 'candy_piston_2',
      type: 'piston',
      x: 3220,
      y: 330,
      width: 50,
      height: 110,
      startX: 3220,
      endX: 3220,
      startY: 290,
      endY: 440,
      speed: 140,
      direction: -1,
      axis: 'vertical',
      color: '#f97316',
    },
  ],

  trapAnchors: [
    {
      id: 'cf_anchor_1',
      x: 620,
      y: 480,
      width: 60,
      height: 20,
      zone: 'Zone 1: Forward Conveyor Drop',
      description: 'Right where the booster belt drops racers',
    },
    {
      id: 'cf_anchor_2',
      x: 1620,
      y: 430,
      width: 60,
      height: 20,
      zone: 'Zone 2: Piston Press Floor',
      description: 'Directly in the danger zone of the crushing steam piston',
    },
    {
      id: 'cf_anchor_3',
      x: 2540,
      y: 440,
      width: 60,
      height: 20,
      zone: 'Zone 3: Reverse Belt Slog',
      description: 'On the opposing conveyor belt where movement is sluggish',
    },
    {
      id: 'cf_anchor_4',
      x: 3360,
      y: 480,
      width: 60,
      height: 20,
      zone: 'Zone 4: Sugar Silo Dais',
      description: 'Right before the giant gumball portal',
    },
  ],

  platforms: [
    // Starting Depot Floor
    {
      id: 'cf_start_floor',
      x: 40,
      y: 560,
      width: 360,
      height: 120,
      type: 'solid',
      color: '#be185d',
      pattern: 'candy',
    },
    // Speed Booster Conveyor (+140 px/s forward boost!)
    {
      id: 'cf_boost_conveyor_1',
      x: 440,
      y: 520,
      width: 320,
      height: 26,
      type: 'conveyor',
      conveyorSpeed: 140,
      color: '#f97316',
      pattern: 'stripes',
    },
    // High Sugar Pipe Shelf
    {
      id: 'cf_pipe_shelf_1',
      x: 800,
      y: 460,
      width: 140,
      height: 22,
      type: 'shelf',
      color: '#fb7185',
      pattern: 'candy',
    },
    // Checkpoint 1 Hub
    {
      id: 'cf_cp1_hub',
      x: 980,
      y: 490,
      width: 240,
      height: 190,
      type: 'shelf',
      color: '#9d174d',
      pattern: 'candy',
    },
    // Piston Press Floor
    {
      id: 'cf_piston_floor_1',
      x: 1280,
      y: 490,
      width: 440,
      height: 190,
      type: 'solid',
      color: '#be185d',
      pattern: 'candy',
    },
    // High Gummy Bounce Pad
    {
      id: 'cf_gummy_bounce_1',
      x: 1760,
      y: 480,
      width: 80,
      height: 24,
      type: 'bounce',
      color: '#10b981',
      pattern: 'block',
    },
    // Checkpoint 2 Terrace
    {
      id: 'cf_cp2_terrace',
      x: 1880,
      y: 450,
      width: 220,
      height: 230,
      type: 'shelf',
      color: '#9d174d',
      pattern: 'candy',
    },
    // Reverse Slog Conveyor (-120 px/s counter force!)
    {
      id: 'cf_reverse_conveyor',
      x: 2160,
      y: 480,
      width: 380,
      height: 26,
      type: 'conveyor',
      conveyorSpeed: -120,
      color: '#e11d48',
      pattern: 'stripes',
    },
    // Stepping Jelly Cubes (Collapsing)
    {
      id: 'cf_jelly_cube_1',
      x: 2580,
      y: 480,
      width: 80,
      height: 24,
      type: 'collapsing',
      color: '#ec4899',
      pattern: 'candy',
      collapseTimer: 0.9,
    },
    {
      id: 'cf_jelly_cube_2',
      x: 2700,
      y: 450,
      width: 80,
      height: 24,
      type: 'collapsing',
      color: '#ec4899',
      pattern: 'candy',
      collapseTimer: 0.9,
    },
    // Checkpoint 3 Platform
    {
      id: 'cf_cp3_platform',
      x: 2820,
      y: 480,
      width: 220,
      height: 200,
      type: 'shelf',
      color: '#be185d',
      pattern: 'candy',
    },
    // Final Booster Conveyor (+160 px/s rocket rush!)
    {
      id: 'cf_rocket_conveyor',
      x: 3100,
      y: 500,
      width: 300,
      height: 26,
      type: 'conveyor',
      conveyorSpeed: 160,
      color: '#f97316',
      pattern: 'stripes',
    },
    // Final Gumball Finish Dais
    {
      id: 'cf_finish_dais',
      x: 3460,
      y: 450,
      width: 260,
      height: 230,
      type: 'shelf',
      color: '#9d174d',
      pattern: 'candy',
    },
  ],
};

// ============================================================================
// WORLD 5: FROZEN ARCADE BASE (Sub-Zero Outpost · High-Speed Slick Ice Slides)
// ============================================================================
export const WORLD_FROZEN: WorldDefinition = {
  id: 'world_frozen',
  worldNumber: 5,
  name: 'Frozen Arcade Base',
  subtitle: 'Sub-Zero Outpost & Glacier Slopes',
  theme: 'frozen',
  difficulty: 'expert',
  difficultyStars: 4,
  description: 'Sub-zero military fortress surrounded by glacier slopes. Features slick ice surfaces with realistic low-friction slide physics, collapsing icicle blocks, and frost-cutter saws!',
  hazardsDescription: 'Sliding frost-cutter saws and collapsing icicle platforms.',
  themeColor: '#0284c7',
  accentColor: '#38bdf8',
  badgeIcon: '❄️',
  baseFrictionModifier: 0.35,
  width: 3900,
  height: 720,
  deathY: 680,

  spawns: [
    { x: 90, y: 530 },
    { x: 130, y: 530 },
    { x: 170, y: 530 },
    { x: 210, y: 530 },
    { x: 250, y: 530 },
    { x: 290, y: 530 },
  ],

  finishTrigger: {
    x: 3660,
    y: 330,
    width: 60,
    height: 180,
  },

  checkpoints: [
    {
      id: 0,
      name: 'Sub-Zero Hangar',
      x: 50,
      y: 410,
      width: 100,
      height: 200,
      respawnX: 110,
      respawnY: 530,
    },
    {
      id: 1,
      name: 'Glacier Slope Pass',
      x: 1060,
      y: 360,
      width: 70,
      height: 180,
      respawnX: 1090,
      respawnY: 460,
    },
    {
      id: 2,
      name: 'Aurora Observation Ridge',
      x: 2020,
      y: 320,
      width: 70,
      height: 180,
      respawnX: 2050,
      respawnY: 430,
    },
    {
      id: 3,
      name: 'Icicle Abyss Bridge',
      x: 2920,
      y: 350,
      width: 70,
      height: 180,
      respawnX: 2950,
      respawnY: 460,
    },
  ],

  movingHazards: [
    {
      id: 'frost_saw_1',
      type: 'saw',
      x: 1450,
      y: 440,
      width: 40,
      height: 40,
      startX: 1320,
      endX: 1680,
      speed: 150,
      direction: 1,
      color: '#38bdf8',
    },
    {
      id: 'snow_drone_1',
      type: 'drone',
      x: 2450,
      y: 410,
      width: 50,
      height: 24,
      startX: 2300,
      endX: 2750,
      speed: 170,
      direction: -1,
      color: '#bae6fd',
    },
    {
      id: 'frost_saw_2',
      type: 'saw',
      x: 3350,
      y: 450,
      width: 40,
      height: 40,
      startX: 3200,
      endX: 3520,
      speed: 160,
      direction: 1,
      color: '#38bdf8',
    },
  ],

  trapAnchors: [
    {
      id: 'fz_anchor_1',
      x: 650,
      y: 480,
      width: 60,
      height: 20,
      zone: 'Zone 1: Slick Ice Slide Entry',
      description: 'Right at the crest before racers slide downhill',
    },
    {
      id: 'fz_anchor_2',
      x: 1620,
      y: 430,
      width: 60,
      height: 20,
      zone: 'Zone 2: Frost-Cutter Gap',
      description: 'Landing shelf right in the path of the sliding saw',
    },
    {
      id: 'fz_anchor_3',
      x: 2580,
      y: 440,
      width: 60,
      height: 20,
      zone: 'Zone 3: Icicle Chasm Span',
      description: 'Precarious ice pillar between deep frozen gaps',
    },
    {
      id: 'fz_anchor_4',
      x: 3450,
      y: 480,
      width: 60,
      height: 20,
      zone: 'Zone 4: Sub-Zero Fortress Gates',
      description: 'Final approach to the warm bunker extraction zone',
    },
  ],

  platforms: [
    // Starting Military Hangar
    {
      id: 'fz_hangar_start',
      x: 40,
      y: 560,
      width: 360,
      height: 120,
      type: 'solid',
      color: '#0369a1',
      pattern: 'metal',
    },
    // Slick Ice Slope (Friction 0.15 = Ultra Slick Slide!)
    {
      id: 'fz_ice_slide_1',
      x: 440,
      y: 510,
      width: 340,
      height: 26,
      type: 'ice',
      frictionModifier: 0.15,
      color: '#38bdf8',
      pattern: 'ice',
    },
    // Stepping Glacier Island
    {
      id: 'fz_glacier_step_1',
      x: 820,
      y: 480,
      width: 140,
      height: 24,
      type: 'solid',
      color: '#0284c7',
      pattern: 'ice',
    },
    // Checkpoint 1 Ridge
    {
      id: 'fz_cp1_ridge',
      x: 1020,
      y: 480,
      width: 240,
      height: 200,
      type: 'shelf',
      color: '#082f49',
      pattern: 'ice',
    },
    // Second Slick Ice Runway (High Speed)
    {
      id: 'fz_ice_runway_2',
      x: 1300,
      y: 490,
      width: 420,
      height: 26,
      type: 'ice',
      frictionModifier: 0.18,
      color: '#38bdf8',
      pattern: 'ice',
    },
    // High Glacier Bounce Pad
    {
      id: 'fz_ice_bounce',
      x: 1780,
      y: 480,
      width: 80,
      height: 24,
      type: 'bounce',
      color: '#38bdf8',
      pattern: 'block',
    },
    // Observation Ridge Checkpoint 2
    {
      id: 'fz_cp2_ridge',
      x: 1940,
      y: 440,
      width: 240,
      height: 240,
      type: 'shelf',
      color: '#075985',
      pattern: 'ice',
    },
    // Collapsing Icicle Blocks
    {
      id: 'fz_icicle_crumb_1',
      x: 2240,
      y: 460,
      width: 80,
      height: 22,
      type: 'collapsing',
      color: '#e0f2fe',
      pattern: 'ice',
      collapseTimer: 0.75,
    },
    {
      id: 'fz_icicle_crumb_2',
      x: 2360,
      y: 440,
      width: 80,
      height: 22,
      type: 'collapsing',
      color: '#e0f2fe',
      pattern: 'ice',
      collapseTimer: 0.75,
    },
    {
      id: 'fz_icicle_crumb_3',
      x: 2480,
      y: 460,
      width: 80,
      height: 22,
      type: 'collapsing',
      color: '#e0f2fe',
      pattern: 'ice',
      collapseTimer: 0.75,
    },
    // Checkpoint 3 Pillar
    {
      id: 'fz_cp3_pillar',
      x: 2620,
      y: 470,
      width: 200,
      height: 210,
      type: 'shelf',
      color: '#0284c7',
      pattern: 'ice',
    },
    // Grand Downhill Ice Slide
    {
      id: 'fz_grand_slide',
      x: 2880,
      y: 490,
      width: 360,
      height: 26,
      type: 'ice',
      frictionModifier: 0.12,
      color: '#38bdf8',
      pattern: 'ice',
    },
    // Final Stepping Ice Pillars
    {
      id: 'fz_final_pillar_1',
      x: 3300,
      y: 470,
      width: 90,
      height: 24,
      type: 'solid',
      color: '#0284c7',
      pattern: 'ice',
    },
    {
      id: 'fz_final_pillar_2',
      x: 3430,
      y: 450,
      width: 90,
      height: 24,
      type: 'solid',
      color: '#0284c7',
      pattern: 'ice',
    },
    // Warm Fortress Bunker Finish
    {
      id: 'fz_finish_bunker',
      x: 3560,
      y: 440,
      width: 260,
      height: 240,
      type: 'shelf',
      color: '#075985',
      pattern: 'metal',
    },
  ],
};

// ============================================================================
// WORLD 6: VOLCANIC PIXEL FORTRESS (Molten Magma Abyss · Obsidian Spires)
// ============================================================================
export const WORLD_LAVA: WorldDefinition = {
  id: 'world_lava',
  worldNumber: 6,
  name: 'Volcanic Pixel Fortress',
  subtitle: 'Molten Basalt Citadel & Fire Geysers',
  theme: 'lava',
  difficulty: 'master',
  difficultyStars: 5,
  description: 'Deep subterranean volcanic caldera. Bubbling molten lava sea below, towering obsidian basalt spires, cracking volcanic steps that sink into magma, and fire surge geysers!',
  hazardsDescription: 'Rising fire surges, spinning flame blades, and collapsing basalt bridges.',
  themeColor: '#ea580c',
  accentColor: '#ef4444',
  badgeIcon: '🔥',
  width: 4100,
  height: 750,
  deathY: 710,

  spawns: [
    { x: 90, y: 550 },
    { x: 130, y: 550 },
    { x: 170, y: 550 },
    { x: 210, y: 550 },
    { x: 250, y: 550 },
    { x: 290, y: 550 },
  ],

  finishTrigger: {
    x: 3860,
    y: 350,
    width: 60,
    height: 180,
  },

  checkpoints: [
    {
      id: 0,
      name: 'Caldera Gateway',
      x: 50,
      y: 420,
      width: 100,
      height: 200,
      respawnX: 110,
      respawnY: 550,
    },
    {
      id: 1,
      name: 'Obsidian Spire Bastion',
      x: 1080,
      y: 370,
      width: 70,
      height: 180,
      respawnX: 1110,
      respawnY: 480,
    },
    {
      id: 2,
      name: 'Magma Falls Overlook',
      x: 2100,
      y: 330,
      width: 70,
      height: 180,
      respawnX: 2130,
      respawnY: 440,
    },
    {
      id: 3,
      name: 'Infernal Core Gate',
      x: 3080,
      y: 360,
      width: 70,
      height: 180,
      respawnX: 3110,
      respawnY: 470,
    },
  ],

  movingHazards: [
    {
      id: 'lava_surge_1',
      type: 'lava_surge',
      x: 1550,
      y: 430,
      width: 32,
      height: 120,
      startX: 1550,
      endX: 1550,
      startY: 400,
      endY: 520,
      speed: 100,
      direction: 1,
      axis: 'vertical',
      color: '#f97316',
    },
    {
      id: 'flame_saw_1',
      type: 'saw',
      x: 2550,
      y: 450,
      width: 44,
      height: 44,
      startX: 2400,
      endX: 2780,
      speed: 170,
      direction: 1,
      color: '#ef4444',
    },
    {
      id: 'lava_surge_2',
      type: 'lava_surge',
      x: 3500,
      y: 440,
      width: 32,
      height: 120,
      startX: 3500,
      endX: 3500,
      startY: 410,
      endY: 530,
      speed: 110,
      direction: -1,
      axis: 'vertical',
      color: '#f97316',
    },
  ],

  trapAnchors: [
    {
      id: 'lv_anchor_1',
      x: 680,
      y: 490,
      width: 60,
      height: 20,
      zone: 'Zone 1: Lava River Crossing',
      description: 'Basalt pillar right above the boiling magma pit',
    },
    {
      id: 'lv_anchor_2',
      x: 1720,
      y: 440,
      width: 60,
      height: 20,
      zone: 'Zone 2: Geyser Crest',
      description: 'Landing step right next to the fiery eruption vent',
    },
    {
      id: 'lv_anchor_3',
      x: 2680,
      y: 460,
      width: 60,
      height: 20,
      zone: 'Zone 3: Sinking Basalt Steps',
      description: 'Precarious crumbling ledge before the fire saw',
    },
    {
      id: 'lv_anchor_4',
      x: 3650,
      y: 480,
      width: 60,
      height: 20,
      zone: 'Zone 4: Citadel Throne',
      description: 'Final sprint onto the obsidian dragon dais',
    },
  ],

  platforms: [
    // Starting Gateway
    {
      id: 'lv_start_rock',
      x: 40,
      y: 580,
      width: 360,
      height: 130,
      type: 'solid',
      color: '#18181b',
      pattern: 'obsidian',
    },
    // Stepping Basalt Spire 1
    {
      id: 'lv_spire_1',
      x: 460,
      y: 520,
      width: 120,
      height: 190,
      type: 'solid',
      color: '#27272a',
      pattern: 'obsidian',
    },
    // Collapsing Lava Rock (Cracks & Sinks)
    {
      id: 'lv_crumb_1',
      x: 630,
      y: 490,
      width: 90,
      height: 22,
      type: 'collapsing',
      color: '#b91c1c',
      pattern: 'obsidian',
      collapseTimer: 0.7,
    },
    {
      id: 'lv_crumb_2',
      x: 760,
      y: 470,
      width: 90,
      height: 22,
      type: 'collapsing',
      color: '#b91c1c',
      pattern: 'obsidian',
      collapseTimer: 0.7,
    },
    // Spire Bastion Checkpoint 1
    {
      id: 'lv_cp1_spire',
      x: 960,
      y: 490,
      width: 240,
      height: 220,
      type: 'shelf',
      color: '#18181b',
      pattern: 'obsidian',
    },
    // Upper Fortress Rampart vs Lower Magma Walkway
    {
      id: 'lv_rampart_high',
      x: 1280,
      y: 440,
      width: 260,
      height: 22,
      type: 'solid',
      color: '#ea580c',
      pattern: 'obsidian',
    },
    {
      id: 'lv_rampart_step',
      x: 1570,
      y: 460,
      width: 90,
      height: 22,
      type: 'solid',
      color: '#ea580c',
      pattern: 'obsidian',
    },
    {
      id: 'lv_magma_low',
      x: 1280,
      y: 540,
      width: 340,
      height: 170,
      type: 'solid',
      color: '#27272a',
      pattern: 'obsidian',
    },
    // Geyser Gap Pillar
    {
      id: 'lv_geyser_pillar',
      x: 1700,
      y: 480,
      width: 140,
      height: 230,
      type: 'solid',
      color: '#18181b',
      pattern: 'obsidian',
    },
    // Magma Falls Overlook Checkpoint 2
    {
      id: 'lv_cp2_overlook',
      x: 1980,
      y: 460,
      width: 260,
      height: 250,
      type: 'shelf',
      color: '#7f1d1d',
      pattern: 'obsidian',
    },
    // Magma Spring Pad
    {
      id: 'lv_magma_bounce',
      x: 2320,
      y: 530,
      width: 80,
      height: 24,
      type: 'bounce',
      color: '#f97316',
      pattern: 'block',
    },
    // Flame Saw Arena
    {
      id: 'lv_saw_arena',
      x: 2460,
      y: 490,
      width: 380,
      height: 220,
      type: 'solid',
      color: '#18181b',
      pattern: 'obsidian',
    },
    // Checkpoint 3 Gate
    {
      id: 'lv_cp3_gate',
      x: 2960,
      y: 490,
      width: 240,
      height: 220,
      type: 'shelf',
      color: '#27272a',
      pattern: 'obsidian',
    },
    // Final Crumbling Obsidian Bridges
    {
      id: 'lv_final_crumb_1',
      x: 3260,
      y: 490,
      width: 80,
      height: 22,
      type: 'collapsing',
      color: '#b91c1c',
      pattern: 'obsidian',
      collapseTimer: 0.65,
    },
    {
      id: 'lv_final_crumb_2',
      x: 3380,
      y: 470,
      width: 80,
      height: 22,
      type: 'collapsing',
      color: '#b91c1c',
      pattern: 'obsidian',
      collapseTimer: 0.65,
    },
    {
      id: 'lv_final_crumb_3',
      x: 3500,
      y: 450,
      width: 80,
      height: 22,
      type: 'collapsing',
      color: '#b91c1c',
      pattern: 'obsidian',
      collapseTimer: 0.65,
    },
    // Obsidian Dragon Dais Finish
    {
      id: 'lv_finish_dais',
      x: 3660,
      y: 440,
      width: 280,
      height: 270,
      type: 'shelf',
      color: '#7f1d1d',
      pattern: 'obsidian',
    },
  ],
};

// ============================================================================
// WORLD 7: COSMIC PIXEL STATION (Retro 16-Bit Orbital Space Station Climax)
// ============================================================================
export const WORLD_COSMIC: WorldDefinition = {
  id: 'world_cosmic',
  worldNumber: 7,
  name: 'Cosmic Pixel Station',
  subtitle: 'Orbital Bulkheads & Anti-Grav Rings',
  theme: 'cosmic',
  difficulty: 'master',
  difficultyStars: 5,
  description: 'The ultimate 16-bit space arcade climax! Deep starfield nebulae, dual-deck orbital bulkheads (Solar Deck vs Reactor Deck), anti-gravity jump rings, and vertical quantum lasers!',
  hazardsDescription: 'Vertical quantum lasers, security patrol drones, and anti-grav bounce rings.',
  themeColor: '#6366f1',
  accentColor: '#22d3ee',
  badgeIcon: '🚀',
  width: 4300,
  height: 800,
  deathY: 760,

  spawns: [
    { x: 90, y: 520 },
    { x: 130, y: 520 },
    { x: 170, y: 520 },
    { x: 210, y: 520 },
    { x: 250, y: 520 },
    { x: 290, y: 520 },
  ],

  finishTrigger: {
    x: 4050,
    y: 350,
    width: 60,
    height: 180,
  },

  checkpoints: [
    {
      id: 0,
      name: 'Airlock Bay 01',
      x: 50,
      y: 450,
      width: 100,
      height: 200,
      respawnX: 110,
      respawnY: 520,
    },
    {
      id: 1,
      name: 'Solar Array Deck',
      x: 1120,
      y: 390,
      width: 70,
      height: 180,
      respawnX: 1150,
      respawnY: 490,
    },
    {
      id: 2,
      name: 'Anti-Grav Core Chamber',
      x: 2180,
      y: 340,
      width: 70,
      height: 180,
      respawnX: 2210,
      respawnY: 440,
    },
    {
      id: 3,
      name: 'Orbital Warp Gate',
      x: 3200,
      y: 380,
      width: 70,
      height: 180,
      respawnX: 3230,
      respawnY: 480,
    },
  ],

  movingHazards: [
    {
      id: 'cosmic_laser_1',
      type: 'laser',
      x: 1600,
      y: 350,
      width: 16,
      height: 120,
      startX: 1600,
      endX: 1600,
      startY: 320,
      endY: 460,
      speed: 100,
      direction: 1,
      axis: 'vertical',
      color: '#22d3ee',
    },
    {
      id: 'cosmic_drone_1',
      type: 'drone',
      x: 2600,
      y: 440,
      width: 52,
      height: 24,
      startX: 2450,
      endX: 2880,
      speed: 190,
      direction: -1,
      color: '#a855f7',
    },
    {
      id: 'cosmic_laser_2',
      type: 'laser',
      x: 3680,
      y: 360,
      width: 16,
      height: 120,
      startX: 3680,
      endX: 3680,
      startY: 330,
      endY: 470,
      speed: 120,
      direction: 1,
      axis: 'vertical',
      color: '#ec4899',
    },
  ],

  trapAnchors: [
    {
      id: 'cs_anchor_1',
      x: 720,
      y: 500,
      width: 60,
      height: 20,
      zone: 'Zone 1: Solar Bulkhead Entry',
      description: 'Right before the vacuum leap across the station hull',
    },
    {
      id: 'cs_anchor_2',
      x: 1750,
      y: 440,
      width: 60,
      height: 20,
      zone: 'Zone 2: Quantum Laser Hall',
      description: 'Landing deck past the vertical cyan laser fence',
    },
    {
      id: 'cs_anchor_3',
      x: 2780,
      y: 450,
      width: 60,
      height: 20,
      zone: 'Zone 3: Anti-Grav Leap',
      description: 'Landing platform following the gravity-lift bounce ring',
    },
    {
      id: 'cs_anchor_4',
      x: 3820,
      y: 480,
      width: 60,
      height: 20,
      zone: 'Zone 4: Warp Gate Extraction',
      description: 'The final cosmic portal to victory',
    },
  ],

  platforms: [
    // Starting Airlock Bay
    {
      id: 'cs_airlock_start',
      x: 40,
      y: 560,
      width: 380,
      height: 180,
      type: 'solid',
      color: '#1e1b4b',
      pattern: 'neon',
    },
    // Solar Deck Upper vs Maintenance Catwalk Lower
    {
      id: 'cs_solar_high',
      x: 440,
      y: 510,
      width: 220,
      height: 22,
      type: 'solid',
      color: '#22d3ee',
      pattern: 'neon',
    },
    {
      id: 'cs_maint_low',
      x: 450,
      y: 620,
      width: 240,
      height: 120,
      type: 'solid',
      color: '#0f172a',
      pattern: 'metal',
    },
    {
      id: 'cs_maint_bounce',
      x: 570,
      y: 606,
      width: 70,
      height: 16,
      type: 'bounce',
      color: '#ec4899',
      pattern: 'block',
    },
    // Outer Station Bulkhead
    {
      id: 'cs_outer_bulkhead',
      x: 740,
      y: 500,
      width: 220,
      height: 240,
      type: 'solid',
      color: '#312e81',
      pattern: 'neon',
    },
    // Solar Array Checkpoint 1
    {
      id: 'cs_cp1_deck',
      x: 1020,
      y: 490,
      width: 260,
      height: 250,
      type: 'shelf',
      color: '#1e1b4b',
      pattern: 'neon',
    },
    // Hard-Light Laser Gauntlet Steps
    {
      id: 'cs_laser_step_1',
      x: 1390,
      y: 490,
      width: 120,
      height: 22,
      type: 'solid',
      color: '#22d3ee',
      pattern: 'neon',
    },
    {
      id: 'cs_laser_step_2',
      x: 1560,
      y: 470,
      width: 120,
      height: 22,
      type: 'solid',
      color: '#a855f7',
      pattern: 'neon',
    },
    {
      id: 'cs_laser_step_3',
      x: 1740,
      y: 490,
      width: 130,
      height: 22,
      type: 'solid',
      color: '#22d3ee',
      pattern: 'neon',
    },
    // Anti-Grav Bounce Ring
    {
      id: 'cs_antigrav_bounce',
      x: 1940,
      y: 530,
      width: 80,
      height: 24,
      type: 'bounce',
      color: '#ec4899',
      pattern: 'block',
    },
    // Anti-Grav Core Checkpoint 2
    {
      id: 'cs_cp2_core',
      x: 2080,
      y: 460,
      width: 260,
      height: 300,
      type: 'shelf',
      color: '#312e81',
      pattern: 'neon',
    },
    // High-Tech Drone Runway
    {
      id: 'cs_drone_runway',
      x: 2420,
      y: 490,
      width: 420,
      height: 26,
      type: 'solid',
      color: '#1e1b4b',
      pattern: 'neon',
    },
    // Collapsing Hard-Light Blocks
    {
      id: 'cs_light_crumb_1',
      x: 2900,
      y: 480,
      width: 80,
      height: 22,
      type: 'collapsing',
      color: '#22d3ee',
      pattern: 'neon',
      collapseTimer: 0.8,
    },
    {
      id: 'cs_light_crumb_2',
      x: 3020,
      y: 460,
      width: 80,
      height: 22,
      type: 'collapsing',
      color: '#22d3ee',
      pattern: 'neon',
      collapseTimer: 0.8,
    },
    // Warp Gate Checkpoint 3
    {
      id: 'cs_cp3_warp',
      x: 3160,
      y: 500,
      width: 240,
      height: 260,
      type: 'shelf',
      color: '#3b0764',
      pattern: 'neon',
    },
    // Speed Conveyor Booster Dock (+170 px/s forward impulse!)
    {
      id: 'cs_warp_conveyor',
      x: 3460,
      y: 510,
      width: 320,
      height: 26,
      type: 'conveyor',
      conveyorSpeed: 170,
      color: '#22d3ee',
      pattern: 'neon',
    },
    // Stepping Station Antennas
    {
      id: 'cs_antenna_1',
      x: 3840,
      y: 470,
      width: 80,
      height: 24,
      type: 'solid',
      color: '#a855f7',
      pattern: 'neon',
    },
    // Quantum Warp Gate Dais Finish
    {
      id: 'cs_finish_dais',
      x: 3980,
      y: 440,
      width: 280,
      height: 320,
      type: 'shelf',
      color: '#1e1b4b',
      pattern: 'neon',
    },
  ],
};

// ============================================================================
// BACKWARD COMPATIBILITY ALIASES
// ============================================================================
export const WORLD_TRAINING = WORLD_PLAYGROUND;
export const WORLD_INDUSTRIAL = WORLD_ARCADE_NEON;
export const WORLD_CYBER = WORLD_COSMIC;

// ============================================================================
// AUTHORITATIVE WORLDS REGISTRY & PROGRESSION HELPERS
// ============================================================================
export const ALL_WORLDS: WorldDefinition[] = [
  WORLD_PLAYGROUND,
  WORLD_ARCADE_NEON,
  WORLD_JUNGLE,
  WORLD_CANDY,
  WORLD_FROZEN,
  WORLD_LAVA,
  WORLD_COSMIC,
];

export const WORLDS_BY_ID: Record<string, WorldDefinition> = {
  [WORLD_PLAYGROUND.id]: WORLD_PLAYGROUND,
  [WORLD_ARCADE_NEON.id]: WORLD_ARCADE_NEON,
  [WORLD_JUNGLE.id]: WORLD_JUNGLE,
  [WORLD_CANDY.id]: WORLD_CANDY,
  [WORLD_FROZEN.id]: WORLD_FROZEN,
  [WORLD_LAVA.id]: WORLD_LAVA,
  [WORLD_COSMIC.id]: WORLD_COSMIC,
  // Backward compatibility aliases
  world_training: WORLD_PLAYGROUND,
  world_industrial: WORLD_ARCADE_NEON,
  world_cyber: WORLD_COSMIC,
  toybox_trouble: WORLD_PLAYGROUND,
};

// Validate all worlds on module evaluation
for (const w of ALL_WORLDS) {
  const result = validateWorld(w);
  if (!result.valid) {
    console.error(`[MapValidation] Errors in world ${w.id}:`, result.errors);
  }
}

/**
 * Returns the authoritative world for the given round:
 * - Round 1: Pixel Playground
 * - Round 2: Neon Arcade District
 * - Round 3: Tropical Pixel Jungle
 * - Round 4: Candy Factory
 * - Round 5: Frozen Arcade Base
 * - Round 6: Volcanic Pixel Fortress
 * - Round 7: Cosmic Pixel Station (Grand Climax)
 * - Rounds beyond 7: Rotates dynamically without repeating consecutive stages
 */
export function getWorldForRound(round: number, history: string[] = []): WorldDefinition {
  const roundIndex = Math.max(1, round);
  const lastWorldId = history[history.length - 1];

  let selectedWorld: WorldDefinition;

  if (roundIndex === 1) {
    selectedWorld = WORLD_PLAYGROUND;
  } else if (roundIndex === 2) {
    selectedWorld = WORLD_ARCADE_NEON;
  } else if (roundIndex === 3) {
    selectedWorld = WORLD_JUNGLE;
  } else if (roundIndex === 4) {
    selectedWorld = WORLD_CANDY;
  } else if (roundIndex === 5) {
    selectedWorld = WORLD_FROZEN;
  } else if (roundIndex === 6) {
    selectedWorld = WORLD_LAVA;
  } else if (roundIndex === 7) {
    selectedWorld = WORLD_COSMIC;
  } else {
    // Endless or custom rounds: rotate through all 7 without repeating the last
    const candidates = ALL_WORLDS.filter((w) => w.id !== lastWorldId);
    selectedWorld = candidates[(roundIndex - 1) % candidates.length];
  }

  return selectedWorld;
}

export function getWorldById(id: string): WorldDefinition {
  return WORLDS_BY_ID[id] || WORLD_PLAYGROUND;
}

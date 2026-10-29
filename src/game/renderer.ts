/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { SharedGroupCamera } from './camera';
import { drawCharacter, getCharacterInfo } from './characters';
import { LevelData } from './levelData';
import { PlacedTrap, PlayerState, TrapType } from './types';
import { drawTrapVisual } from './traps';

export interface VisualParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
  type: 'sparkle' | 'dust' | 'slime' | 'wood';
}

export interface FloatingText {
  id: string;
  x: number;
  y: number;
  text: string;
  color: string;
  life: number;
  maxLife: number;
  vy: number;
  scale: number;
}

export class GameRenderer {
  public particles: VisualParticle[] = [];
  public floatingTexts: FloatingText[] = [];

  public spawnParticles(
    x: number,
    y: number,
    count: number,
    color: string,
    type: 'sparkle' | 'dust' | 'slime' | 'wood' = 'dust'
  ) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 120 + 30;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - (type === 'sparkle' ? 40 : 10),
        life: 0.4 + Math.random() * 0.4,
        maxLife: 0.8,
        color,
        size: Math.random() * 3 + 2,
        type,
      });
    }
  }

  public showFloatingText(x: number, y: number, text: string, color: string = '#facc15') {
    this.floatingTexts.push({
      id: Math.random().toString(36).substring(2, 8),
      x,
      y,
      text,
      color,
      life: 1.1,
      maxLife: 1.1,
      vy: -45,
      scale: 0.8,
    });
  }

  public updateFloatingTexts(dt: number) {
    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const ft = this.floatingTexts[i];
      ft.y += ft.vy * dt;
      ft.life -= dt;
      const progress = 1 - ft.life / ft.maxLife;
      if (progress < 0.2) {
        ft.scale = 0.8 + (progress / 0.2) * 0.4;
      } else {
        ft.scale = 1.2 - (progress - 0.2) * 0.25;
      }
      if (ft.life <= 0) {
        this.floatingTexts.splice(i, 1);
      }
    }
  }

  public drawFloatingTexts(ctx: CanvasRenderingContext2D) {
    for (const ft of this.floatingTexts) {
      ctx.save();
      const alpha = Math.min(1, ft.life / 0.25);
      ctx.globalAlpha = Math.max(0, alpha);
      ctx.translate(ft.x, ft.y);
      ctx.scale(ft.scale, ft.scale);

      ctx.font = '900 13px "Fredoka", "Poppins", sans-serif';
      ctx.textAlign = 'center';

      // Drop shadow outline
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 4;
      ctx.strokeText(ft.text, 0, 0);

      // Bright comic text fill
      ctx.fillStyle = ft.color;
      ctx.fillText(ft.text, 0, 0);

      ctx.restore();
    }
  }

  public updateParticles(dt: number) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt;
      if (p.type !== 'sparkle') {
        p.vy += 250 * dt; // gravity for dust/slime
      }
      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }
    this.updateFloatingTexts(dt);
  }

  public render(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    level: LevelData,
    players: PlayerState[],
    traps: PlacedTrap[],
    camera: SharedGroupCamera,
    showAnchors: boolean = false,
    selectedAnchorId: string | null = null,
    highlightedAnchorId: string | null = null,
    cursorGhostTrap?: { x: number; y: number; type: TrapType } | null
  ) {
    ctx.save();

    // Clear background
    ctx.fillStyle = '#0f172a'; // Deep slate base
    ctx.fillRect(0, 0, width, height);

    // Apply Camera Transform
    ctx.save();
    ctx.translate(width / 2, height / 2);
    ctx.scale(camera.zoom, camera.zoom);
    ctx.translate(-camera.x, -camera.y);

    // 1. Draw World-Specific Parallax Background
    this.drawWorldBackground(ctx, level, camera);

    // 2. Draw Level Platforms & Shelves
    this.drawPlatforms(ctx, level);

    // 3. Draw Checkpoint Arches
    this.drawCheckpoints(ctx, level, players);

    // 4. Draw Finish Line Banner
    this.drawFinishLine(ctx, level);

    // 5. Draw Moving Hazards (Train & Wind-Up)
    this.drawHazards(ctx, level);

    // 6. Draw Trap Anchors (during placement phase)
    if (showAnchors) {
      this.drawTrapAnchors(ctx, level, traps, selectedAnchorId, highlightedAnchorId);
    }

    // 7. Draw Active Traps & Cursor Ghost Preview
    this.drawTraps(ctx, traps, showAnchors, cursorGhostTrap);

    // 8. Draw Dynamic Projected Ground Drop Shadows beneath all racers
    this.drawPlayerDropShadows(ctx, players, level);

    // 9. Draw Particles (dust, sparkles, slime)
    this.drawParticles(ctx);

    // 10. Draw Players (with running dust effects)
    this.drawPlayers(ctx, players);

    // 11. Draw Floating Action Texts
    this.drawFloatingTexts(ctx);

    ctx.restore(); // Restore camera transform

    // 12. Draw Screen-Space Overlays (Off-Screen Indicators)
    this.drawOffscreenIndicators(ctx, camera);

    // 13. Draw Cinematic Vignette & Atmospheric Contrast
    this.drawCinematicVignette(ctx, width, height);

    // 14. 16-Bit Retro Arcade CRT Scanlines
    this.drawRetroArcadeScanlines(ctx, width, height);

    ctx.restore();
  }

  private drawRetroArcadeScanlines(ctx: CanvasRenderingContext2D, width: number, height: number) {
    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.08)';
    for (let y = 0; y < height; y += 4) {
      ctx.fillRect(0, y, width, 1.5);
    }
    ctx.restore();
  }

  private drawWorldBackground(
    ctx: CanvasRenderingContext2D,
    level: LevelData,
    _camera: SharedGroupCamera
  ) {
    const theme = level.theme || 'playground';
    const tick = performance.now() / 350;

    if (theme === 'arcade_neon' || theme === 'industrial') {
      // Cyberpunk Neon City Rooftops at Night
      const skyGrad = ctx.createLinearGradient(0, 0, 0, level.height);
      skyGrad.addColorStop(0, '#090514');
      skyGrad.addColorStop(0.5, '#1e1035');
      skyGrad.addColorStop(1, '#3b0764');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, level.width, level.height);

      // Distant pixel city skyline with glowing windows
      for (let fx = 80; fx < level.width; fx += 260) {
        const bldgH = 280 + ((fx * 13) % 180);
        ctx.fillStyle = '#0f0a20';
        ctx.fillRect(fx, level.height - bldgH, 140, bldgH);

        // Water tower on roof
        ctx.fillStyle = '#1e1b4b';
        ctx.fillRect(fx + 20, level.height - bldgH - 30, 30, 30);
        ctx.fillRect(fx + 33, level.height - bldgH - 45, 4, 15);

        // Blinking red antenna beacon
        if (Math.sin(tick * 3 + fx) > 0) {
          ctx.fillStyle = '#ef4444';
          ctx.fillRect(fx + 32, level.height - bldgH - 48, 6, 6);
        }

        // Glowing neon windows
        for (let wy = level.height - bldgH + 30; wy < level.height - 40; wy += 32) {
          for (let wx = fx + 16; wx < fx + 120; wx += 24) {
            const lit = ((wx * 7 + wy * 11) % 5) < 3;
            ctx.fillStyle = lit ? 'rgba(6, 182, 212, 0.45)' : 'rgba(236, 72, 153, 0.2)';
            ctx.fillRect(wx, wy, 12, 16);
          }
        }

        // Giant Neon Billboards
        if (fx % 520 === 80) {
          ctx.fillStyle = '#18181b';
          ctx.fillRect(fx + 10, level.height - bldgH + 10, 110, 32);
          ctx.strokeStyle = '#ec4899';
          ctx.lineWidth = 2;
          ctx.strokeRect(fx + 10, level.height - bldgH + 10, 110, 32);

          ctx.font = '900 10px "Press Start 2P", monospace';
          ctx.fillStyle = Math.sin(tick * 4) > 0 ? '#facc15' : '#22d3ee';
          ctx.textAlign = 'center';
          ctx.fillText('TOYBOX RACER', fx + 65, level.height - bldgH + 30);
        }
      }

      // Neon grid lines on the bottom abyss
      ctx.strokeStyle = 'rgba(6, 182, 212, 0.3)';
      ctx.lineWidth = 1;
      for (let gx = 0; gx < level.width; gx += 80) {
        ctx.beginPath();
        ctx.moveTo(gx, level.height - 60);
        ctx.lineTo(gx + 20, level.height);
        ctx.stroke();
      }
    } else if (theme === 'jungle') {
      // Ancient Tropical Pixel Jungle & Sunken Mayan Ruins
      const skyGrad = ctx.createLinearGradient(0, 0, 0, level.height);
      skyGrad.addColorStop(0, '#064e3b');
      skyGrad.addColorStop(0.5, '#065f46');
      skyGrad.addColorStop(1, '#022c22');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, level.width, level.height);

      // Cascading pixel waterfalls
      for (let wx = 380; wx < level.width; wx += 680) {
        ctx.fillStyle = 'rgba(56, 189, 248, 0.4)';
        ctx.fillRect(wx, 140, 48, level.height - 140);
        ctx.fillStyle = 'rgba(224, 242, 254, 0.7)';
        ctx.fillRect(wx + 8, 140, 12, level.height - 140);
        // Animated splash foam at bottom
        const foamY = level.deathY - 10 + Math.sin(tick * 4 + wx) * 4;
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(wx - 10, foamY, 68, 14);
      }

      // Ancient carved stone temple silhouettes
      ctx.fillStyle = 'rgba(4, 47, 46, 0.75)';
      for (let jx = 120; jx < level.width; jx += 420) {
        // Stepped pyramid silhouette
        ctx.fillRect(jx, 260, 180, level.height - 260);
        ctx.fillRect(jx + 25, 200, 130, 60);
        ctx.fillRect(jx + 50, 150, 80, 50);
        // Temple door
        ctx.fillStyle = '#022c22';
        ctx.fillRect(jx + 75, 170, 30, 30);
        ctx.fillStyle = 'rgba(4, 47, 46, 0.75)';
      }

      // Hanging jungle moss and vines
      ctx.strokeStyle = 'rgba(21, 128, 61, 0.6)';
      ctx.lineWidth = 4;
      for (let vx = 50; vx < level.width; vx += 120) {
        ctx.beginPath();
        ctx.moveTo(vx, 0);
        ctx.quadraticCurveTo(vx + 25, 160, vx - 10, 260);
        ctx.stroke();
      }
    } else if (theme === 'candy') {
      // Confectionery Candy Factory with Peppermint Machinery
      const skyGrad = ctx.createLinearGradient(0, 0, 0, level.height);
      skyGrad.addColorStop(0, '#4a044e');
      skyGrad.addColorStop(0.5, '#701a75');
      skyGrad.addColorStop(1, '#9d174d');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, level.width, level.height);

      // Giant candy syrup vats & lollipop gears
      ctx.fillStyle = 'rgba(190, 24, 93, 0.5)';
      for (let cx = 140; cx < level.width; cx += 380) {
        ctx.beginPath();
        ctx.arc(cx, 240, 75, 0, Math.PI * 2);
        ctx.fill();

        // Animated swirling lollipop spiral
        ctx.strokeStyle = 'rgba(253, 224, 71, 0.4)';
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.arc(cx, 240, 45, tick, tick + Math.PI * 1.5);
        ctx.stroke();

        // Candy vat base
        ctx.fillStyle = '#500724';
        ctx.fillRect(cx - 50, 310, 100, level.height - 310);
      }

      // Peppermint pipes across the ceiling
      ctx.fillStyle = '#f97316';
      ctx.fillRect(0, 100, level.width, 18);
      ctx.fillStyle = '#ffffff';
      for (let px = 0; px < level.width; px += 40) {
        ctx.fillRect(px, 100, 16, 18);
      }
    } else if (theme === 'frozen') {
      // Sub-zero Polar Glacier Outpost with Aurora Borealis
      const skyGrad = ctx.createLinearGradient(0, 0, 0, level.height);
      skyGrad.addColorStop(0, '#082f49');
      skyGrad.addColorStop(0.5, '#075985');
      skyGrad.addColorStop(1, '#0c4a6e');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, level.width, level.height);

      // Aurora Borealis undulating wave
      ctx.fillStyle = 'rgba(56, 189, 248, 0.2)';
      ctx.beginPath();
      ctx.moveTo(0, 100);
      for (let ax = 0; ax <= level.width; ax += 160) {
        ctx.lineTo(ax, 100 + Math.sin(ax * 0.004 + tick * 0.5) * 55);
      }
      ctx.lineTo(level.width, 0);
      ctx.lineTo(0, 0);
      ctx.closePath();
      ctx.fill();

      // Jagged snow-capped peaks in distance
      ctx.fillStyle = 'rgba(224, 242, 254, 0.25)';
      for (let px = 0; px < level.width; px += 260) {
        ctx.beginPath();
        ctx.moveTo(px, level.height);
        ctx.lineTo(px + 130, 200);
        ctx.lineTo(px + 260, level.height);
        ctx.closePath();
        ctx.fill();
        // Snow cap
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.moveTo(px + 90, 250);
        ctx.lineTo(px + 130, 200);
        ctx.lineTo(px + 170, 250);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = 'rgba(224, 242, 254, 0.25)';
      }

      // Icicles hanging from top
      ctx.fillStyle = '#e0f2fe';
      for (let ix = 20; ix < level.width; ix += 48) {
        const iceLen = 15 + ((ix * 13) % 25);
        ctx.beginPath();
        ctx.moveTo(ix - 5, 0);
        ctx.lineTo(ix + 5, 0);
        ctx.lineTo(ix, iceLen);
        ctx.closePath();
        ctx.fill();
      }
    } else if (theme === 'lava') {
      // Dark Volcanic Basalt Cavern with Bubbling Lava Sea
      const skyGrad = ctx.createLinearGradient(0, 0, 0, level.height);
      skyGrad.addColorStop(0, '#1c1917');
      skyGrad.addColorStop(0.6, '#292524');
      skyGrad.addColorStop(1, '#7f1d1d');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, level.width, level.height);

      // Bubbling Molten Lava Sea at the bottom
      const lavaY = level.deathY - 20;
      const lavaGrad = ctx.createLinearGradient(0, lavaY, 0, level.height);
      lavaGrad.addColorStop(0, '#f97316');
      lavaGrad.addColorStop(0.4, '#ef4444');
      lavaGrad.addColorStop(1, '#991b1b');
      ctx.fillStyle = lavaGrad;
      ctx.fillRect(0, lavaY, level.width, level.height - lavaY);

      // Animated rising heat bubbles & embers
      ctx.fillStyle = 'rgba(254, 240, 138, 0.6)';
      for (let lx = 40; lx < level.width; lx += 70) {
        const bY = lavaY - 6 - Math.abs(Math.sin(tick * 2 + lx)) * 12;
        ctx.beginPath();
        ctx.arc(lx, bY, 4 + ((lx * 7) % 4), 0, Math.PI * 2);
        ctx.fill();
      }

      // Basalt stalactites hanging from ceiling
      ctx.fillStyle = '#292524';
      for (let sx = 60; sx < level.width; sx += 160) {
        ctx.beginPath();
        ctx.moveTo(sx - 25, 0);
        ctx.lineTo(sx + 25, 0);
        ctx.lineTo(sx, 100 + (sx % 50));
        ctx.closePath();
        ctx.fill();
      }
    } else if (theme === 'cosmic' || theme === 'cyber') {
      // Deep 16-Bit Space with Starfield & Ringed Planet
      const skyGrad = ctx.createLinearGradient(0, 0, 0, level.height);
      skyGrad.addColorStop(0, '#030712');
      skyGrad.addColorStop(0.7, '#0f172a');
      skyGrad.addColorStop(1, '#1e1b4b');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, level.width, level.height);

      // Twinkling pixel starfield
      for (let sx = 20; sx < level.width; sx += 70) {
        const sy = (sx * 37) % (level.height - 120);
        const blink = Math.sin(tick * 3 + sx) > 0.2;
        ctx.fillStyle = blink ? '#ffffff' : '#67e8f9';
        ctx.fillRect(sx, sy, 2, 2);
        if (sx % 280 === 20) {
          ctx.fillRect(sx - 1, sy, 4, 2);
          ctx.fillRect(sx, sy - 1, 2, 4);
        }
      }

      // Giant ringed pixel planet in background
      for (let px = 800; px < level.width; px += 1800) {
        ctx.fillStyle = '#312e81';
        ctx.beginPath();
        ctx.arc(px, 220, 80, 0, Math.PI * 2);
        ctx.fill();
        // Planet rings
        ctx.strokeStyle = '#22d3ee';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.ellipse(px, 220, 140, 25, Math.PI * 0.15, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Space station lattice girder beam
      ctx.fillStyle = 'rgba(30, 27, 75, 0.7)';
      ctx.fillRect(0, 280, level.width, 16);
      ctx.strokeStyle = '#06b6d4';
      ctx.lineWidth = 1;
      ctx.strokeRect(0, 280, level.width, 16);
    } else {
      // World 1: Pixel Playground (Classic 16-bit sunny grassland)
      const skyGrad = ctx.createLinearGradient(0, 0, 0, level.height);
      skyGrad.addColorStop(0, '#38bdf8');
      skyGrad.addColorStop(0.6, '#60a5fa');
      skyGrad.addColorStop(1, '#93c5fd');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, level.width, level.height);

      // Fluffy white pixel clouds
      ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
      for (let cx = 100; cx < level.width; cx += 320) {
        const cy = 110 + ((cx * 7) % 60);
        ctx.fillRect(cx, cy, 110, 30);
        ctx.fillRect(cx + 20, cy - 18, 70, 20);
        ctx.fillRect(cx + 40, cy - 30, 35, 15);
      }

      // Distant rolling green pixel hills
      ctx.fillStyle = '#16a34a';
      for (let hx = 0; hx < level.width; hx += 380) {
        ctx.beginPath();
        ctx.arc(hx + 190, level.height + 80, 280, Math.PI, 0);
        ctx.fill();
      }

      ctx.fillStyle = '#22c55e';
      for (let hx = 180; hx < level.width; hx += 380) {
        ctx.beginPath();
        ctx.arc(hx + 190, level.height + 110, 260, Math.PI, 0);
        ctx.fill();
      }
    }
  }

  private drawPlatforms(ctx: CanvasRenderingContext2D, level: LevelData) {
    const tick = performance.now() / 250;

    for (const plat of level.platforms) {
      if (plat.collapsed) {
        // Draw subtle ghost outline so racers know a collapsed block was there and is respawning
        ctx.save();
        ctx.strokeStyle = 'rgba(239, 68, 68, 0.35)';
        ctx.setLineDash([4, 4]);
        ctx.lineWidth = 1.5;
        ctx.strokeRect(plat.x, plat.y, plat.width, plat.height);
        ctx.restore();
        continue;
      }

      ctx.save();

      // Shake and rapid warning flicker animation if collapsing
      if (plat.type === 'collapsing' && plat.collapseTimer !== undefined) {
        const shakeX = (Math.random() - 0.5) * 8;
        const shakeY = (Math.random() - 0.5) * 4;
        ctx.translate(shakeX, shakeY);

        // Warning flicker as floor is about to crumble & drop
        const flickerRate = plat.collapseTimer < 0.35 ? 24 : 12;
        if (Math.floor(plat.collapseTimer * flickerRate) % 2 === 0) {
          ctx.globalAlpha = 0.45;
        }
      }

      const pCol = plat.color || '#3b82f6';

      if (plat.type === 'shelf') {
        // Shelf style per pattern
        if (plat.pattern === 'metal') {
          // Riveted industrial steel beam
          ctx.fillStyle = '#475569';
          ctx.fillRect(plat.x, plat.y, plat.width, plat.height);
          ctx.fillStyle = '#f59e0b';
          ctx.fillRect(plat.x, plat.y, plat.width, 4); // caution strip
          ctx.fillStyle = '#334155';
          ctx.fillRect(plat.x, plat.y + plat.height - 6, plat.width, 6);
          // Rivets
          ctx.fillStyle = '#cbd5e1';
          for (let rx = plat.x + 12; rx < plat.x + plat.width; rx += 28) {
            ctx.beginPath();
            ctx.arc(rx, plat.y + 12, 2.5, 0, Math.PI * 2);
            ctx.fill();
          }
        } else if (plat.pattern === 'stone') {
          // Weathered ancient stone with moss
          ctx.fillStyle = '#1e3a1f';
          ctx.fillRect(plat.x, plat.y, plat.width, plat.height);
          ctx.fillStyle = '#15803d';
          ctx.fillRect(plat.x, plat.y, plat.width, 6); // lush moss cap
          ctx.fillStyle = '#14532d';
          ctx.fillRect(plat.x, plat.y + plat.height - 8, plat.width, 8);
        } else if (plat.pattern === 'ice') {
          // Shimmering translucent glacier shelf
          ctx.fillStyle = '#0284c7';
          ctx.fillRect(plat.x, plat.y, plat.width, plat.height);
          ctx.fillStyle = '#e0f2fe';
          ctx.fillRect(plat.x, plat.y, plat.width, 6); // snowdrifts on top
          ctx.fillStyle = '#0369a1';
          ctx.fillRect(plat.x, plat.y + plat.height - 6, plat.width, 6);
        } else if (plat.pattern === 'obsidian') {
          // Obsidian basalt keep with fiery magma cracks
          ctx.fillStyle = '#18181b';
          ctx.fillRect(plat.x, plat.y, plat.width, plat.height);
          ctx.fillStyle = '#f97316';
          ctx.fillRect(plat.x, plat.y, plat.width, 4); // molten edge
          ctx.fillStyle = '#7f1d1d';
          ctx.fillRect(plat.x, plat.y + plat.height - 6, plat.width, 6);
        } else if (plat.pattern === 'neon') {
          // Futuristic hard-light cyber shelf
          ctx.fillStyle = 'rgba(14, 116, 144, 0.9)';
          ctx.fillRect(plat.x, plat.y, plat.width, plat.height);
          ctx.fillStyle = '#06b6d4';
          ctx.fillRect(plat.x, plat.y, plat.width, 4);
          ctx.strokeStyle = '#22d3ee';
          ctx.lineWidth = 1.5;
          ctx.strokeRect(plat.x, plat.y, plat.width, plat.height);
        } else if (plat.pattern === 'candy') {
          // Confectionery shelf with sweet peppermint stripes
          ctx.fillStyle = '#ec4899';
          ctx.fillRect(plat.x, plat.y, plat.width, plat.height);
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(plat.x, plat.y, plat.width, 5); // sugar icing
          ctx.fillStyle = '#9d174d';
          ctx.fillRect(plat.x, plat.y + plat.height - 6, plat.width, 6);
          // Diagonal candy stripes
          ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
          for (let sx = plat.x; sx < plat.x + plat.width; sx += 22) {
            ctx.beginPath();
            ctx.moveTo(sx, plat.y + plat.height);
            ctx.lineTo(sx + 10, plat.y + 5);
            ctx.lineTo(sx + 16, plat.y + 5);
            ctx.lineTo(sx + 6, plat.y + plat.height);
            ctx.closePath();
            ctx.fill();
          }
        } else if (plat.pattern === 'cosmic') {
          // Orbital station bulkhead with hard-light rim
          ctx.fillStyle = '#1e1b4b';
          ctx.fillRect(plat.x, plat.y, plat.width, plat.height);
          ctx.fillStyle = '#22d3ee';
          ctx.fillRect(plat.x, plat.y, plat.width, 4); // hard-light rim
          ctx.fillStyle = '#312e81';
          ctx.fillRect(plat.x, plat.y + plat.height - 6, plat.width, 6);
          ctx.strokeStyle = '#06b6d4';
          ctx.lineWidth = 1.5;
          ctx.strokeRect(plat.x, plat.y, plat.width, plat.height);
          // Quantum starlight rivets
          ctx.fillStyle = '#a5f3fc';
          for (let rx = plat.x + 16; rx < plat.x + plat.width; rx += 36) {
            ctx.fillRect(rx, plat.y + 10, 3, 3);
          }
        } else {
          // Wooden toy shelf with plank lines & beveled border
          ctx.fillStyle = pCol;
          ctx.fillRect(plat.x, plat.y, plat.width, plat.height);
          ctx.fillStyle = '#d97706';
          ctx.fillRect(plat.x, plat.y, plat.width, 6);
          ctx.fillStyle = '#78350f';
          ctx.fillRect(plat.x, plat.y + plat.height - 6, plat.width, 6);
          ctx.strokeStyle = 'rgba(0, 0, 0, 0.15)';
          ctx.lineWidth = 2;
          for (let gx = plat.x + 40; gx < plat.x + plat.width; gx += 60) {
            ctx.beginPath();
            ctx.moveTo(gx, plat.y + 6);
            ctx.lineTo(gx, plat.y + plat.height - 6);
            ctx.stroke();
          }
        }
      } else if (plat.type === 'ice') {
        // Crystalline slippery ice surface with sparkling glints
        ctx.fillStyle = '#38bdf8';
        ctx.fillRect(plat.x, plat.y, plat.width, plat.height);
        ctx.fillStyle = '#f0f9ff';
        ctx.fillRect(plat.x, plat.y, plat.width, 4);
        ctx.fillStyle = '#0284c7';
        ctx.fillRect(plat.x, plat.y + plat.height - 4, plat.width, 4);

        // Ice crystal glints
        ctx.fillStyle = '#ffffff';
        for (let ix = plat.x + 20; ix < plat.x + plat.width; ix += 40) {
          ctx.fillRect(ix, plat.y + 6, 3, 3);
          ctx.fillRect(ix + 1, plat.y + 5, 1, 5);
        }
      } else if (plat.type === 'conveyor') {
        // High-tech moving conveyor belt with animated direction arrows
        ctx.fillStyle = pCol;
        ctx.fillRect(plat.x, plat.y, plat.width, plat.height);
        ctx.fillStyle = '#f59e0b';
        ctx.fillRect(plat.x, plat.y, plat.width, 4);

        // Animated chevrons moving with speed
        const speed = plat.conveyorSpeed || 100;
        const offset = (tick * (speed > 0 ? 15 : -15)) % 24;
        ctx.fillStyle = '#fef08a';
        for (let cx = plat.x + 10 + offset; cx < plat.x + plat.width - 10; cx += 24) {
          ctx.beginPath();
          if (speed > 0) {
            ctx.moveTo(cx, plat.y + 6);
            ctx.lineTo(cx + 8, plat.y + plat.height / 2);
            ctx.lineTo(cx, plat.y + plat.height - 6);
          } else {
            ctx.moveTo(cx + 8, plat.y + 6);
            ctx.lineTo(cx, plat.y + plat.height / 2);
            ctx.lineTo(cx + 8, plat.y + plat.height - 6);
          }
          ctx.stroke();
        }
      } else if (plat.type === 'bounce') {
        // Check if Jungle theme (Spore mushroom)
        if (level.theme === 'jungle') {
          // Bouncy giant red & white polka dot mushroom cap
          ctx.fillStyle = '#ef4444';
          ctx.beginPath();
          ctx.ellipse(plat.x + plat.width / 2, plat.y + 6, plat.width / 2, 8, 0, Math.PI, 0);
          ctx.fill();
          // White polka dots
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(plat.x + plat.width / 2, plat.y + 3, 3, 0, Math.PI * 2);
          ctx.arc(plat.x + plat.width / 2 - 14, plat.y + 5, 2.5, 0, Math.PI * 2);
          ctx.arc(plat.x + plat.width / 2 + 14, plat.y + 5, 2.5, 0, Math.PI * 2);
          ctx.fill();
        } else {
          // Bouncy golden spring plate
          ctx.fillStyle = '#475569';
          ctx.fillRect(plat.x, plat.y + 6, plat.width, 6);
          ctx.fillStyle = '#f59e0b';
          ctx.fillRect(plat.x + 2, plat.y, plat.width - 4, 6);
          ctx.strokeStyle = '#e2e8f0';
          ctx.lineWidth = 3;
          ctx.beginPath();
          const mid = plat.x + plat.width / 2;
          ctx.moveTo(mid - 12, plat.y + 5);
          ctx.lineTo(mid, plat.y + 2);
          ctx.lineTo(mid + 12, plat.y + 5);
          ctx.stroke();
        }
      } else if (plat.type === 'collapsing') {
        // Warning hazard striped crumbling block
        ctx.fillStyle = pCol;
        ctx.fillRect(plat.x, plat.y, plat.width, plat.height);
        ctx.fillStyle = '#ef4444';
        for (let sx = plat.x; sx < plat.x + plat.width; sx += 16) {
          ctx.fillRect(sx, plat.y, 8, plat.height);
        }

        // Jagged animated fracture cracks when triggered & collapsing
        if (plat.collapseTimer !== undefined) {
          ctx.strokeStyle = '#fef08a';
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.moveTo(plat.x + plat.width * 0.25, plat.y);
          ctx.lineTo(plat.x + plat.width * 0.38, plat.y + plat.height * 0.55);
          ctx.lineTo(plat.x + plat.width * 0.32, plat.y + plat.height);
          ctx.moveTo(plat.x + plat.width * 0.65, plat.y);
          ctx.lineTo(plat.x + plat.width * 0.72, plat.y + plat.height * 0.6);
          ctx.lineTo(plat.x + plat.width * 0.85, plat.y + plat.height);
          ctx.stroke();
        }
      } else {
        // Solid theme-tailored blocks
        ctx.fillStyle = pCol;
        ctx.fillRect(plat.x, plat.y, plat.width, plat.height);

        // Top highlight
        ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
        ctx.fillRect(plat.x, plat.y, plat.width, 3);
        // Bottom shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
        ctx.fillRect(plat.x, plat.y + plat.height - 4, plat.width, 4);

        if (plat.pattern === 'block' || (!plat.pattern && level.theme === 'training')) {
          // Lego-style studs on top
          const studW = 12;
          const studH = 5;
          const spacing = 20;
          ctx.fillStyle = pCol;
          for (let sx = plat.x + 6; sx + studW <= plat.x + plat.width; sx += spacing) {
            ctx.fillRect(sx, plat.y - studH, studW, studH);
            ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
            ctx.fillRect(sx + 1, plat.y - studH + 1, studW - 2, 2);
            ctx.fillStyle = pCol;
          }
        }
      }

      ctx.restore();
    }
  }

  private drawCheckpoints(
    ctx: CanvasRenderingContext2D,
    level: LevelData,
    players: PlayerState[]
  ) {
    for (const cp of level.checkpoints) {
      if (cp.id === 0) continue; // Spawn doesn't need flag arch

      const isClaimedByAny = players.some((p) => p.lastCheckpointId >= cp.id);

      // Checkered checkpoint arch posts
      const poleH = 70;
      const baseY = cp.y + cp.height;

      // Left post
      ctx.fillStyle = isClaimedByAny ? '#22c55e' : '#94a3b8';
      ctx.fillRect(cp.x, baseY - poleH, 6, poleH);
      // Right post
      ctx.fillRect(cp.x + cp.width - 6, baseY - poleH, 6, poleH);

      // Banner tape
      ctx.fillStyle = isClaimedByAny ? '#16a34a' : '#475569';
      ctx.fillRect(cp.x, baseY - poleH, cp.width, 14);

      // Label
      ctx.fillStyle = '#ffffff';
      ctx.font = '8px "Press Start 2P", monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`CP ${cp.id}`, cp.x + cp.width / 2, baseY - poleH + 10);

      // Glowing orb on top of poles
      ctx.fillStyle = isClaimedByAny ? '#4ade80' : '#64748b';
      ctx.beginPath();
      ctx.arc(cp.x + 3, baseY - poleH, 5, 0, Math.PI * 2);
      ctx.arc(cp.x + cp.width - 3, baseY - poleH, 5, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  private drawFinishLine(ctx: CanvasRenderingContext2D, level: LevelData) {
    const ft = level.finishTrigger;

    // Checkered arch posts
    const poleW = 10;
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(ft.x, ft.y, poleW, ft.height);
    ctx.fillRect(ft.x + ft.width - poleW, ft.y, poleW, ft.height);

    // Black checker squares on poles
    ctx.fillStyle = '#0f172a';
    for (let py = ft.y; py < ft.y + ft.height; py += 20) {
      ctx.fillRect(ft.x, py, poleW, 10);
      ctx.fillRect(ft.x + ft.width - poleW, py + 10, poleW, 10);
    }

    // Overhead Arch Sign
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(ft.x - 10, ft.y - 45, ft.width + 20, 36);
    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 3;
    ctx.strokeRect(ft.x - 10, ft.y - 45, ft.width + 20, 36);

    ctx.fillStyle = '#fef08a';
    ctx.font = 'bold 12px "Press Start 2P", monospace';
    ctx.textAlign = 'center';
    ctx.fillText('FINISH', ft.x + ft.width / 2, ft.y - 22);

    // Checkered ribbon across middle
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(ft.x + poleW, ft.y + 50, ft.width - poleW * 2, 12);
    ctx.fillStyle = '#0f172a';
    for (let rx = ft.x + poleW; rx < ft.x + ft.width - poleW; rx += 12) {
      ctx.fillRect(rx, ft.y + 50, 6, 12);
    }
  }

  private drawHazards(ctx: CanvasRenderingContext2D, level: LevelData) {
    for (const h of level.movingHazards) {
      if (h.type === 'train') {
        // Red wooden locomotive
        ctx.save();
        ctx.translate(h.x, h.y);

        // Train body
        ctx.fillStyle = h.color;
        ctx.fillRect(0, 0, h.width, h.height);

        // Cab
        ctx.fillStyle = '#b91c1c';
        ctx.fillRect(h.direction > 0 ? 0 : h.width - 45, -20, 45, 30);

        // Cab window
        ctx.fillStyle = '#38bdf8';
        ctx.fillRect(h.direction > 0 ? 8 : h.width - 37, -14, 20, 14);

        // Smokestack
        const chimneyX = h.direction > 0 ? h.width - 24 : 12;
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(chimneyX, -22, 12, 22);
        // Smoke puff
        ctx.fillStyle = 'rgba(241, 245, 249, 0.7)';
        ctx.beginPath();
        ctx.arc(chimneyX + 6, -28, 6, 0, Math.PI * 2);
        ctx.arc(chimneyX + 2, -34, 9, 0, Math.PI * 2);
        ctx.fill();

        // Big Cowcatcher grill on front
        ctx.fillStyle = '#fbbf24';
        const cowX = h.direction > 0 ? h.width : -14;
        ctx.beginPath();
        ctx.moveTo(cowX, h.height);
        ctx.lineTo(h.direction > 0 ? cowX + 14 : cowX, h.height - 18);
        ctx.lineTo(h.direction > 0 ? cowX : cowX + 14, 10);
        ctx.closePath();
        ctx.fill();

        // Steel wheels
        ctx.fillStyle = '#475569';
        for (let wx = 15; wx < h.width; wx += 35) {
          ctx.beginPath();
          ctx.arc(wx, h.height + 4, 8, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#cbd5e1';
          ctx.fillRect(wx - 2, h.height + 2, 4, 4);
          ctx.fillStyle = '#475569';
        }

        ctx.restore();
      } else if (h.type === 'windup') {
        // Wind-up tin toy hazard
        ctx.save();
        ctx.translate(h.x, h.y);

        // Body
        ctx.fillStyle = h.color;
        ctx.fillRect(0, 0, h.width, h.height);

        // Spinning brass key on top
        ctx.fillStyle = '#fbbf24';
        ctx.fillRect(h.width / 2 - 2, -14, 4, 14);
        ctx.beginPath();
        ctx.arc(h.width / 2, -14, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#9333ea';
        ctx.beginPath();
        ctx.arc(h.width / 2, -14, 3, 0, Math.PI * 2);
        ctx.fill();

        // Angry robot eyes
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(h.direction > 0 ? 28 : 8, 12, 6, 6);
        ctx.fillRect(h.direction > 0 ? 38 : 18, 12, 6, 6);

        // Walking metal legs
        ctx.fillStyle = '#334155';
        ctx.fillRect(6, h.height, 10, 8);
        ctx.fillRect(h.width - 16, h.height, 10, 8);

        ctx.restore();
      } else if (h.type === 'saw') {
        // Rotating circular buzzsaw with sharp steel teeth
        ctx.save();
        const cx = h.x + h.width / 2;
        const cy = h.y + h.height / 2;
        const radius = h.width / 2;
        const spin = (performance.now() / 80) * (h.direction || 1);

        ctx.translate(cx, cy);
        ctx.rotate(spin);

        // Saw blade body
        ctx.fillStyle = '#cbd5e1';
        ctx.beginPath();
        ctx.arc(0, 0, radius - 4, 0, Math.PI * 2);
        ctx.fill();

        // Teeth
        ctx.fillStyle = h.color || '#f97316';
        const numTeeth = 8;
        for (let i = 0; i < numTeeth; i++) {
          const a = (i * Math.PI * 2) / numTeeth;
          ctx.beginPath();
          ctx.moveTo(Math.cos(a) * (radius - 5), Math.sin(a) * (radius - 5));
          ctx.lineTo(Math.cos(a + 0.25) * radius, Math.sin(a + 0.25) * radius);
          ctx.lineTo(Math.cos(a + 0.5) * (radius - 5), Math.sin(a + 0.5) * (radius - 5));
          ctx.closePath();
          ctx.fill();
        }

        // Center hub
        ctx.fillStyle = '#334155';
        ctx.beginPath();
        ctx.arc(0, 0, 7, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#fbbf24';
        ctx.beginPath();
        ctx.arc(0, 0, 3, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
      } else if (h.type === 'gear') {
        // Heavy industrial cogwheel
        ctx.save();
        const cx = h.x + h.width / 2;
        const cy = h.y + h.height / 2;
        const r = h.width / 2;
        const spin = (performance.now() / 140) * (h.direction || 1);

        ctx.translate(cx, cy);
        ctx.rotate(spin);

        ctx.fillStyle = h.color || '#ea580c';
        // 6 cog teeth
        for (let i = 0; i < 6; i++) {
          ctx.rotate(Math.PI / 3);
          ctx.fillRect(-6, -r, 12, r * 2);
        }

        // Center disk
        ctx.fillStyle = '#78350f';
        ctx.beginPath();
        ctx.arc(0, 0, r - 6, 0, Math.PI * 2);
        ctx.fill();
        // Inner hole
        ctx.fillStyle = '#1e293b';
        ctx.beginPath();
        ctx.arc(0, 0, 8, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
      } else if (h.type === 'laser') {
        // Pulsing electric laser barrier
        ctx.save();
        // Top & bottom emitters
        ctx.fillStyle = '#475569';
        ctx.fillRect(h.x, h.y, h.width, 10);
        ctx.fillRect(h.x, h.y + h.height - 10, h.width, 10);
        ctx.fillStyle = h.color;
        ctx.fillRect(h.x + 4, h.y + 2, h.width - 8, 6);
        ctx.fillRect(h.x + 4, h.y + h.height - 8, h.width - 8, 6);

        // Pulsing beam
        const beamPulse = Math.sin(performance.now() / 80) * 3;
        const beamW = Math.max(4, h.width / 2 + beamPulse);
        const bx = h.x + (h.width - beamW) / 2;

        ctx.fillStyle = h.color || '#ec4899';
        ctx.fillRect(bx, h.y + 10, beamW, h.height - 20);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(bx + 2, h.y + 10, Math.max(2, beamW - 4), h.height - 20);

        ctx.restore();
      } else if (h.type === 'drone') {
        // High-tech hovering surveillance drone
        ctx.save();
        const hoverY = Math.sin(performance.now() / 180) * 4;
        ctx.translate(h.x, h.y + hoverY);

        // Drone main spherical chassis
        ctx.fillStyle = '#0f172a';
        ctx.beginPath();
        ctx.arc(h.width / 2, h.height / 2, h.width / 2 - 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = h.color || '#38bdf8';
        ctx.lineWidth = 2.5;
        ctx.stroke();

        // Glowing scanning eye
        ctx.fillStyle = h.color || '#38bdf8';
        ctx.beginPath();
        ctx.arc(h.width / 2 + (h.direction > 0 ? 5 : -5), h.height / 2, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(h.width / 2 + (h.direction > 0 ? 6 : -4), h.height / 2 - 2, 2.5, 0, Math.PI * 2);
        ctx.fill();

        // Dual side rotor blades
        ctx.fillStyle = '#94a3b8';
        ctx.fillRect(-6, h.height / 2 - 2, 6, 4);
        ctx.fillRect(h.width, h.height / 2 - 2, 6, 4);

        ctx.restore();
      } else if (h.type === 'lava_surge') {
        // Molten Fireball Surge
        ctx.save();
        ctx.translate(h.x, h.y);
        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.arc(h.width / 2, h.height / 2, h.width / 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#f97316';
        ctx.beginPath();
        ctx.arc(h.width / 2, h.height / 2, h.width / 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#fef08a';
        ctx.beginPath();
        ctx.arc(h.width / 2, h.height / 2, h.width / 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    }
  }

  private drawTrapAnchors(
    ctx: CanvasRenderingContext2D,
    level: LevelData,
    traps: PlacedTrap[],
    selectedAnchorId: string | null,
    highlightedAnchorId: string | null
  ) {
    for (const anchor of level.trapAnchors) {
      const isTaken = traps.some((t) => t.anchorId === anchor.id);
      const isSelected = selectedAnchorId === anchor.id;
      const isHovered = highlightedAnchorId === anchor.id;

      ctx.save();

      if (isTaken) {
        ctx.fillStyle = 'rgba(239, 68, 68, 0.2)';
        ctx.strokeStyle = '#ef4444';
      } else if (isSelected) {
        ctx.fillStyle = 'rgba(234, 179, 8, 0.4)';
        ctx.strokeStyle = '#eab308';
      } else if (isHovered) {
        ctx.fillStyle = 'rgba(56, 189, 248, 0.35)';
        ctx.strokeStyle = '#38bdf8';
      } else {
        ctx.fillStyle = 'rgba(59, 130, 246, 0.2)';
        ctx.strokeStyle = '#3b82f6';
      }

      ctx.lineWidth = isSelected ? 3 : 2;
      ctx.setLineDash([4, 4]);
      ctx.fillRect(anchor.x, anchor.y, anchor.width, anchor.height);
      ctx.strokeRect(anchor.x, anchor.y, anchor.width, anchor.height);

      // Anchor icon / badge
      ctx.fillStyle = '#ffffff';
      ctx.font = '800 10px "Poppins", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(isTaken ? 'LOCKED' : 'TRAP', anchor.x + anchor.width / 2, anchor.y - 6);

      ctx.restore();
    }
  }

  private drawTraps(
    ctx: CanvasRenderingContext2D,
    traps: PlacedTrap[],
    placementMode: boolean,
    cursorGhostTrap?: { x: number; y: number; type: TrapType } | null
  ) {
    const tick = performance.now() / 200;

    // 1. Draw all placed traps
    for (const trap of traps) {
      drawTrapVisual(ctx, trap.type, trap.x, trap.y, trap.width, trap.height, false, tick);

      // In placement mode, display who planted it
      if (placementMode) {
        ctx.save();
        ctx.fillStyle = '#fde047';
        ctx.font = '800 10px "Poppins", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(trap.ownerName.slice(0, 10), trap.x + trap.width / 2, trap.y - 6);
        ctx.restore();
      }
    }

    // 2. Draw live ghost preview under the player's cursor
    if (cursorGhostTrap && placementMode) {
      const tw = cursorGhostTrap.type === 'slime' ? 52 : cursorGhostTrap.type === 'spring' ? 48 : 50;
      const th = cursorGhostTrap.type === 'slime' ? 16 : 18;
      drawTrapVisual(
        ctx,
        cursorGhostTrap.type,
        cursorGhostTrap.x - tw / 2,
        cursorGhostTrap.y - th / 2,
        tw,
        th,
        true,
        tick
      );
    }
  }

  private drawParticles(ctx: CanvasRenderingContext2D) {
    for (const p of this.particles) {
      ctx.save();
      const alpha = Math.max(0, p.life / p.maxLife);
      ctx.globalAlpha = alpha;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  private drawPlayers(ctx: CanvasRenderingContext2D, players: PlayerState[]) {
    for (const p of players) {
      // Dynamic cartoon running dust puffs behind feet when running
      if (p.isGrounded && Math.abs(p.vx) > 130 && Math.random() < 0.28) {
        const footX = p.x - p.facing * 12;
        const footY = p.y;
        this.spawnParticles(footX, footY, 1, 'rgba(226, 232, 240, 0.55)', 'dust');
      }

      // Draw sprite cleanly with NO harsh flickering
      drawCharacter(
        ctx,
        p.characterId,
        p.x,
        p.y,
        p.facing,
        p.runCycle,
        p.isGrounded,
        p.isJumping,
        p.squishX,
        p.squishY,
        p.statusEffect === 'slimed' ? 'slimed' : 'none',
        p.colorVariant
      );

      // Smooth, non-distracting cartoon respawn shield (NO flickering)
      if (p.respawnProtectionTimer > 0) {
        ctx.save();
        const shieldPulse = Math.sin(p.respawnProtectionTimer * 8) * 2;
        const shieldRadius = 24 + shieldPulse;

        // Soft translucent protective bubble
        ctx.beginPath();
        ctx.arc(p.x, p.y - 16, shieldRadius, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(250, 204, 21, 0.2)';
        ctx.fill();
        ctx.strokeStyle = '#facc15';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // 3 cute orbiting cartoon stars
        const starTime = performance.now() / 350;
        for (let i = 0; i < 3; i++) {
          const starAngle = starTime + (i * Math.PI * 2) / 3;
          const sx = p.x + Math.cos(starAngle) * (shieldRadius + 3);
          const sy = p.y - 16 + Math.sin(starAngle) * (shieldRadius * 0.5);
          ctx.fillStyle = '#fef08a';
          ctx.fillRect(sx - 2, sy - 2, 4, 4);
        }
        ctx.restore();
      }

      // Status Visuals: Giant Soap Bubble, Dizzy Stars, Slipping Trails
      if (p.statusEffect === 'bubbled') {
        ctx.save();
        const bubbleR = 25 + Math.sin(performance.now() / 150) * 1.5;
        const bubbleGrad = ctx.createRadialGradient(p.x - 4, p.y - 20, 3, p.x, p.y - 16, bubbleR);
        bubbleGrad.addColorStop(0, 'rgba(255, 255, 255, 0.7)');
        bubbleGrad.addColorStop(0.5, 'rgba(56, 189, 248, 0.4)');
        bubbleGrad.addColorStop(0.85, 'rgba(236, 72, 153, 0.45)');
        bubbleGrad.addColorStop(1, 'rgba(168, 85, 247, 0.6)');
        ctx.fillStyle = bubbleGrad;
        ctx.beginPath();
        ctx.arc(p.x, p.y - 16, bubbleR, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5;
        ctx.stroke();
        // Shine
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(p.x - 7, p.y - 24, 4, 4);
        ctx.restore();
      } else if (p.statusEffect === 'dizzy') {
        // Dizzy circling stars overhead
        ctx.save();
        const spin = performance.now() / 150;
        for (let i = 0; i < 4; i++) {
          const a = spin + (i * Math.PI) / 2;
          const sx = p.x + Math.cos(a) * 16;
          const sy = p.y - 36 + Math.sin(a) * 5;
          ctx.fillStyle = '#facc15';
          ctx.fillRect(sx - 2, sy - 2, 4, 4);
          ctx.fillStyle = '#f59e0b';
          ctx.fillRect(sx - 1, sy - 1, 2, 2);
        }
        ctx.restore();
      } else if (p.statusEffect === 'slipping') {
        // Skid speed lines behind feet
        ctx.save();
        ctx.fillStyle = '#fef08a';
        const skidDir = -p.facing;
        ctx.fillRect(p.x + skidDir * 12, p.y - 3, 10, 2);
        ctx.fillRect(p.x + skidDir * 18, p.y - 6, 8, 2);
        ctx.restore();
      }

      // Player Name Overhead Label
      const charInfo = getCharacterInfo(p.characterId);
      const nameY = p.y - 48;

      ctx.save();
      ctx.font = '800 11px "Poppins", sans-serif';
      ctx.textAlign = 'center';

      // Background rounded tag pill
      const textMetrics = ctx.measureText(p.name);
      const tagW = textMetrics.width + 16;
      const tagH = 16;
      const tagX = p.x - tagW / 2;
      const tagY = nameY - 12;

      ctx.fillStyle = 'rgba(15, 23, 42, 0.92)';
      ctx.beginPath();
      if ((ctx as any).roundRect) {
        (ctx as any).roundRect(tagX, tagY, tagW, tagH, 8);
      } else {
        ctx.rect(tagX, tagY, tagW, tagH);
      }
      ctx.fill();
      ctx.strokeStyle = charInfo.primaryColor;
      ctx.lineWidth = 2;
      ctx.stroke();

      // Drop shadow text stroke
      ctx.strokeStyle = '#020617';
      ctx.lineWidth = 3;
      ctx.strokeText(p.name, p.x, nameY);

      // Player name text
      ctx.fillStyle = '#ffffff';
      ctx.fillText(p.name, p.x, nameY);

      // Finished badge if crossed finish line
      if (p.finished && p.finishRank !== null) {
        ctx.font = '900 10px "Fredoka", "Poppins", sans-serif';
        const rankStr = p.finishRank === 1 ? '👑 1ST!' : `${p.finishRank}TH`;
        ctx.strokeStyle = '#020617';
        ctx.lineWidth = 3;
        ctx.strokeText(rankStr, p.x, nameY - 16);
        ctx.fillStyle = p.finishRank === 1 ? '#facc15' : '#e2e8f0';
        ctx.fillText(rankStr, p.x, nameY - 16);
      }

      ctx.restore();
    }
  }

  private drawOffscreenIndicators(
    ctx: CanvasRenderingContext2D,
    camera: SharedGroupCamera
  ) {
    for (const ind of camera.offscreenPlayers) {
      const p = ind.player;
      const charInfo = getCharacterInfo(p.characterId);

      ctx.save();
      ctx.translate(ind.screenX, ind.screenY);

      // Circular badge backing
      ctx.fillStyle = 'rgba(15, 23, 42, 0.92)';
      ctx.beginPath();
      ctx.arc(0, 0, 22, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = charInfo.primaryColor;
      ctx.lineWidth = 3;
      ctx.stroke();

      // Directional pointer arrow
      ctx.save();
      ctx.rotate(ind.angle);
      ctx.fillStyle = charInfo.primaryColor;
      ctx.beginPath();
      ctx.moveTo(27, 0);
      ctx.lineTo(19, -8);
      ctx.lineTo(19, 8);
      ctx.closePath();
      ctx.fill();
      ctx.restore();

      // Mini character silhouette / icon
      ctx.fillStyle = '#ffffff';
      ctx.font = '900 11px "Poppins", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(p.name.slice(0, 2).toUpperCase(), 0, -2);

      // Distance label below badge
      ctx.fillStyle = '#facc15';
      ctx.font = '800 9px "Poppins", sans-serif';
      ctx.fillText(`${ind.distance}m`, 0, 13);

      ctx.restore();
    }
  }

  private drawPlayerDropShadows(
    ctx: CanvasRenderingContext2D,
    players: PlayerState[],
    level: LevelData
  ) {
    for (const p of players) {
      let bestPlatY = level.deathY;
      for (const plat of level.platforms) {
        if (plat.collapsed) continue;
        if (p.x >= plat.x - 14 && p.x <= plat.x + plat.width + 14) {
          if (plat.y >= p.y - 4 && plat.y < bestPlatY) {
            bestPlatY = plat.y;
          }
        }
      }

      const dist = bestPlatY - p.y;
      if (dist >= 0 && dist < 240) {
        const t = dist / 240;
        const alpha = (1 - t * 0.72) * 0.42;
        const radiusX = Math.max(8, 20 * (1 - t * 0.38));
        const radiusY = Math.max(3, 7 * (1 - t * 0.38));

        ctx.save();
        ctx.fillStyle = `rgba(0, 0, 0, ${alpha.toFixed(2)})`;
        ctx.beginPath();
        ctx.ellipse(p.x, bestPlatY + 1, radiusX, radiusY, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    }
  }

  private drawCinematicVignette(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number
  ) {
    ctx.save();
    const grad = ctx.createRadialGradient(
      width / 2,
      height / 2,
      Math.min(width, height) * 0.4,
      width / 2,
      height / 2,
      Math.max(width, height) * 0.82
    );
    grad.addColorStop(0, 'rgba(0, 0, 0, 0)');
    grad.addColorStop(0.7, 'rgba(15, 23, 42, 0.12)');
    grad.addColorStop(1, 'rgba(2, 6, 23, 0.45)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    // Subtle edge framing at top
    const topBar = ctx.createLinearGradient(0, 0, 0, 32);
    topBar.addColorStop(0, 'rgba(0, 0, 0, 0.3)');
    topBar.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = topBar;
    ctx.fillRect(0, 0, width, 32);

    ctx.restore();
  }
}

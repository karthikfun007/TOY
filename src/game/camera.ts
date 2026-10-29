/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { LevelData } from './levelData';
import { PlayerState } from './types';

export interface OffscreenIndicator {
  player: PlayerState;
  screenX: number;
  screenY: number;
  angle: number;
  distance: number;
}

export class SharedGroupCamera {
  public x: number = 300;
  public y: number = 460;
  public zoom: number = 0.8;

  private targetX: number = 300;
  private targetY: number = 460;
  private targetZoom: number = 0.8;

  // Smoothing params (responsive yet smooth)
  private smoothSpeed: number = 5.5;
  private zoomSpeed: number = 3.5;

  // Limits: minZoom 0.32 allows camera to pull back much further to capture all racers
  public minZoom: number = 0.32;
  public maxZoom: number = 1.05;

  // Dead zone for vertical jitter suppression
  private deadZoneY: number = 30;

  public offscreenPlayers: OffscreenIndicator[] = [];

  public update(
    players: PlayerState[],
    level: LevelData,
    viewportWidth: number,
    viewportHeight: number,
    dt: number,
    focusTarget?: { x: number; y: number } | null,
    isTrapPhase: boolean = false
  ) {
    if (players.length === 0 && !focusTarget) return;

    if (isTrapPhase) {
      if (focusTarget) {
        // Smoothly zoom in on the selected trap anchor
        this.targetX = focusTarget.x;
        this.targetY = focusTarget.y;
        this.targetZoom = 0.85;
      } else {
        // Wide cinematic overview of the course so the player can inspect all trap spots
        this.targetX = 1400;
        this.targetY = 460;
        this.targetZoom = Math.max(0.38, Math.min(0.55, viewportWidth / 2800));
      }
    } else {
      // Normal race mode: follow all active racers and zoom out to frame the entire pack
      let minX = Infinity;
      let maxX = -Infinity;
      let minY = Infinity;
      let maxY = -Infinity;

      for (const p of players) {
        if (p.x < minX) minX = p.x;
        if (p.x > maxX) maxX = p.x;
        if (p.y - 36 < minY) minY = p.y - 36;
        if (p.y > maxY) maxY = p.y;
      }

      // Add generous padding around group so racers are never squished against screen borders
      const padX = 280;
      const padY = 200;
      const groupWidth = Math.max(380, maxX - minX + padX * 2);
      const groupHeight = Math.max(260, maxY - minY + padY * 2);

      // Compute required zoom to fit group in viewport
      const zoomX = viewportWidth / groupWidth;
      const zoomY = viewportHeight / groupHeight;
      const desiredZoom = Math.min(zoomX, zoomY);

      // Clamp zoom to configured limits (can zoom out to 0.32)
      this.targetZoom = Math.max(this.minZoom, Math.min(this.maxZoom, desiredZoom));

      // Desired center in world coordinates, with slight forward look-ahead
      const groupCenterX = (minX + maxX) / 2 + 50;
      const groupCenterY = (minY + maxY) / 2 - 15;

      this.targetX = groupCenterX;

      // Vertical deadzone damping
      if (Math.abs(groupCenterY - this.y) > this.deadZoneY) {
        this.targetY = groupCenterY;
      }
    }

    // Smooth interpolation towards targets
    const lerpFactorPos = Math.min(1, this.smoothSpeed * dt);
    const lerpFactorZoom = Math.min(1, this.zoomSpeed * dt);

    this.x += (this.targetX - this.x) * lerpFactorPos;
    this.y += (this.targetY - this.y) * lerpFactorZoom;
    this.zoom += (this.targetZoom - this.zoom) * lerpFactorZoom;

    // Robust boundary clamping without conflicting edges
    const visibleW = viewportWidth / this.zoom;
    const visibleH = viewportHeight / this.zoom;

    if (visibleW >= level.width) {
      this.x = level.width / 2;
    } else {
      const halfW = visibleW / 2;
      this.x = Math.max(halfW, Math.min(level.width - halfW, this.x));
    }

    if (visibleH >= level.height) {
      this.y = level.height / 2;
    } else {
      const halfH = visibleH / 2;
      this.y = Math.max(halfH, Math.min(level.height - halfH, this.y));
    }

    // Compute Off-screen Indicators
    this.computeOffscreenIndicators(players, viewportWidth, viewportHeight);
  }

  /**
   * Identifies racers who are outside the camera's visible screen rect
   * and calculates border pinned coordinates + angle + distance
   */
  private computeOffscreenIndicators(
    players: PlayerState[],
    viewportWidth: number,
    viewportHeight: number
  ) {
    this.offscreenPlayers = [];

    const visibleLeft = this.x - viewportWidth / (2 * this.zoom);
    const visibleRight = this.x + viewportWidth / (2 * this.zoom);
    const visibleTop = this.y - viewportHeight / (2 * this.zoom);
    const visibleBottom = this.y + viewportHeight / (2 * this.zoom);

    const margin = 42; // Screen margin for pinned badges

    for (const player of players) {
      const isOutside =
        player.x < visibleLeft ||
        player.x > visibleRight ||
        player.y < visibleTop ||
        player.y > visibleBottom;

      if (!isOutside) continue;

      // Project world to screen relative to center
      const screenCenterX = viewportWidth / 2;
      const screenCenterY = viewportHeight / 2;
      const dx = (player.x - this.x) * this.zoom;
      const dy = (player.y - this.y) * this.zoom;

      const angle = Math.atan2(dy, dx);
      const distance = Math.round(Math.hypot(dx, dy) / this.zoom);

      // Intersect ray with screen rectangle
      let edgeX = 0;
      let edgeY = 0;

      const tan = Math.tan(angle);
      const screenHalfW = viewportWidth / 2 - margin;
      const screenHalfH = viewportHeight / 2 - margin;

      if (Math.abs(dx * screenHalfH) > Math.abs(dy * screenHalfW)) {
        // Hits left or right boundary
        edgeX = dx > 0 ? screenHalfW : -screenHalfW;
        edgeY = edgeX * tan;
      } else {
        // Hits top or bottom boundary
        edgeY = dy > 0 ? screenHalfH : -screenHalfH;
        edgeX = edgeY / tan;
      }

      this.offscreenPlayers.push({
        player,
        screenX: screenCenterX + edgeX,
        screenY: screenCenterY + edgeY,
        angle,
        distance,
      });
    }
  }

  public worldToScreen(worldX: number, worldY: number, screenW: number, screenH: number) {
    return {
      x: (worldX - this.x) * this.zoom + screenW / 2,
      y: (worldY - this.y) * this.zoom + screenH / 2,
    };
  }

  public screenToWorld(screenX: number, screenY: number, screenW: number, screenH: number) {
    return {
      x: (screenX - screenW / 2) / this.zoom + this.x,
      y: (screenY - screenH / 2) / this.zoom + this.y,
    };
  }
}

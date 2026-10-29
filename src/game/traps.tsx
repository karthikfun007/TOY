/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef } from 'react';
import { TrapType } from './types';

export interface TrapInfo {
  type: TrapType;
  name: string;
  tag: string;
  badgeColor: string;
  cardBorder: string;
  description: string;
  details: string;
  width: number;
  height: number;
}

export const TRAP_DEFINITIONS: Record<TrapType, TrapInfo> = {
  spring: {
    type: 'spring',
    name: 'Spring Launcher',
    tag: 'Knockback',
    badgeColor: 'bg-amber-500/30 text-amber-300 border-amber-500/50',
    cardBorder: 'border-amber-500 bg-amber-500/10 text-amber-200',
    description: 'Launches racers backwards and skywards with a powerful spring-loaded boxing punch!',
    details: 'Great for placing right before high ledges, jumps, or gap crossings.',
    width: 48,
    height: 18,
  },
  slime: {
    type: 'slime',
    name: 'Sticky Slime',
    tag: 'Slowdown',
    badgeColor: 'bg-emerald-500/30 text-emerald-300 border-emerald-500/50',
    cardBorder: 'border-emerald-500 bg-emerald-500/10 text-emerald-200',
    description: 'Coats rivals in gooey green sludge, cutting top speed to 35% and disabling jumps for 2.4s.',
    details: 'Devastating when placed in high-speed straightaways or right before moving hazards.',
    width: 52,
    height: 16,
  },
  fake_floor: {
    type: 'fake_floor',
    name: 'Fake Floor',
    tag: 'Pit Drop',
    badgeColor: 'bg-rose-500/30 text-rose-300 border-rose-500/50',
    cardBorder: 'border-rose-500 bg-rose-500/10 text-rose-200',
    description: 'Disguised building block that breaks into falling pieces upon contact, plunging racers down.',
    details: 'Effective on narrow shortcut bridges and high-risk upper staircase routes.',
    width: 50,
    height: 18,
  },
  chomp_toy: {
    type: 'chomp_toy',
    name: 'Wind-up Chomp',
    tag: 'Dizzy Spin',
    badgeColor: 'bg-purple-500/30 text-purple-300 border-purple-500/50',
    cardBorder: 'border-purple-500 bg-purple-500/10 text-purple-200',
    description: 'Chattering wind-up teeth trap! Snaps onto racers, sending them spinning out in a dizzy daze for 1.8s.',
    details: 'Hilarious setback when placed at the crest of long jumps or right before checkpoints.',
    width: 44,
    height: 20,
  },
  bubble_blower: {
    type: 'bubble_blower',
    name: 'Bubble Blower',
    tag: 'Float Trap',
    badgeColor: 'bg-sky-500/30 text-sky-300 border-sky-500/50',
    cardBorder: 'border-sky-500 bg-sky-500/10 text-sky-200',
    description: 'Encases rivals inside a floating soapy rainbow bubble that lifts them helplessly before popping!',
    details: 'Pushes racers upwards away from platforms, making them miss critical shortcuts.',
    width: 42,
    height: 22,
  },
  banana_peel: {
    type: 'banana_peel',
    name: 'Slick Banana',
    tag: 'Zero Friction',
    badgeColor: 'bg-yellow-500/30 text-yellow-300 border-yellow-500/50',
    cardBorder: 'border-yellow-500 bg-yellow-500/10 text-yellow-200',
    description: 'Classic comedy hazard! Causes racers to lose all traction, sliding uncontrollably at hyper speed.',
    details: 'Watch rivals slide straight off high platforms or overshoot narrow landing pads!',
    width: 40,
    height: 16,
  },
};

/**
 * Procedural Pixel-Art Trap Renderer
 * Used both in the 60fps game world (and mouse cursor ghost preview)
 * and inside UI preview canvases.
 */
export function drawTrapVisual(
  ctx: CanvasRenderingContext2D,
  type: TrapType,
  x: number,
  y: number,
  width: number,
  height: number,
  isGhost: boolean = false,
  animTick: number = 0
) {
  ctx.save();
  ctx.translate(x, y);

  if (isGhost) {
    ctx.globalAlpha = 0.75;
  }

  switch (type) {
    case 'spring': {
      // 1. Heavy wooden launch box base
      ctx.fillStyle = '#78350f';
      ctx.fillRect(0, height - 7, width, 7);

      // Metal rim & screws
      ctx.fillStyle = '#cbd5e1';
      ctx.fillRect(2, height - 6, 3, 3);
      ctx.fillRect(width - 5, height - 6, 3, 3);
      ctx.fillStyle = '#475569';
      ctx.fillRect(0, height - 7, width, 2);

      // 2. Coiled metallic spring
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 3;
      ctx.beginPath();
      const midX = width / 2;
      const wobble = isGhost ? Math.sin(animTick * 6) * 2 : 0;
      ctx.moveTo(8, height - 7);
      ctx.lineTo(midX - 6 + wobble, height - 11);
      ctx.lineTo(midX + 6 - wobble, height - 13);
      ctx.lineTo(midX, 6);
      ctx.stroke();

      // Highlight on spring
      ctx.strokeStyle = '#f8fafc';
      ctx.lineWidth = 1;
      ctx.stroke();

      // 3. Red boxing glove / rubber launch pad
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.roundRect ? ctx.roundRect(4, 0, width - 8, 8, 3) : ctx.fillRect(4, 0, width - 8, 8);
      ctx.fill();

      // Glove shine & star emblem
      ctx.fillStyle = '#fbbf24';
      ctx.fillRect(midX - 2, 2, 4, 4);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.fillRect(6, 1, width - 14, 2);
      break;
    }

    case 'slime': {
      // 1. Goo puddle base
      ctx.fillStyle = '#15803d';
      ctx.beginPath();
      ctx.ellipse(width / 2, height - 3, width / 2, 5, 0, 0, Math.PI * 2);
      ctx.fill();

      // 2. Bright neon toxic green fluid
      ctx.fillStyle = '#22c55e';
      ctx.beginPath();
      ctx.ellipse(width / 2, height - 5, width / 2 - 3, 4.5, 0, 0, Math.PI * 2);
      ctx.fill();

      // 3. Slime splatters on sides
      ctx.fillStyle = '#4ade80';
      ctx.fillRect(3, height - 6, 5, 3);
      ctx.fillRect(width - 8, height - 7, 5, 4);

      // 4. Animated bubbling slime drops
      const bubble1Y = (height - 9) + Math.sin(animTick * 5) * 2;
      const bubble2Y = (height - 8) + Math.cos(animTick * 4) * 2;
      ctx.fillStyle = '#86efac';
      ctx.beginPath();
      ctx.arc(width / 2 - 9, bubble1Y, 3, 0, Math.PI * 2);
      ctx.arc(width / 2 + 8, bubble2Y, 2.5, 0, Math.PI * 2);
      ctx.fill();

      // Specular highlight
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(width / 2 - 10, bubble1Y - 1, 1, 1);
      ctx.fillRect(width / 2 + 7, bubble2Y - 1, 1, 1);
      break;
    }

    case 'fake_floor': {
      // 1. Disguised toy building block
      ctx.fillStyle = '#f59e0b'; // Amber toy block
      ctx.fillRect(0, 0, width, height);

      // Block studs
      ctx.fillStyle = '#d97706';
      ctx.fillRect(6, -3, 8, 3);
      ctx.fillRect(20, -3, 8, 3);
      ctx.fillRect(34, -3, 8, 3);

      // 2. Jagged warning crack lines
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(8, 2);
      ctx.lineTo(16, height / 2);
      ctx.lineTo(24, 3);
      ctx.lineTo(34, height - 2);
      ctx.lineTo(44, 4);
      ctx.stroke();

      // 3. Falling crumble chips
      ctx.fillStyle = '#b45309';
      ctx.fillRect(14, height / 2 + 1, 3, 3);
      ctx.fillRect(30, height - 5, 3, 3);

      // Danger hash line at bottom
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, height - 3, width, 3);
      ctx.fillStyle = '#ef4444';
      for (let sx = 0; sx < width; sx += 8) {
        ctx.fillRect(sx, height - 3, 4, 3);
      }
      break;
    }

    case 'chomp_toy': {
      // Wind-up chattering teeth trap
      const chompOffset = Math.abs(Math.sin(animTick * 8)) * 5;

      // Top jaw / teeth (red plastic)
      ctx.fillStyle = '#dc2626';
      ctx.beginPath();
      ctx.arc(width / 2, 8 - chompOffset, 12, Math.PI, 0);
      ctx.fill();

      // Top white teeth
      ctx.fillStyle = '#ffffff';
      for (let tx = 6; tx < width - 6; tx += 6) {
        ctx.fillRect(tx, 8 - chompOffset, 4, 4);
      }

      // Bottom jaw (red plastic)
      ctx.fillStyle = '#b91c1c';
      ctx.fillRect(width / 2 - 12, height - 7, 24, 7);

      // Bottom white teeth
      ctx.fillStyle = '#ffffff';
      for (let tx = 6; tx < width - 6; tx += 6) {
        ctx.fillRect(tx, height - 10, 4, 4);
      }

      // Googly cartoon eyes
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(width / 2 - 5, 2 - chompOffset, 3.5, 0, Math.PI * 2);
      ctx.arc(width / 2 + 5, 2 - chompOffset, 3.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(width / 2 - 6, 1 - chompOffset, 2, 2);
      ctx.fillRect(width / 2 + 4, 1 - chompOffset, 2, 2);

      // Wind-up key on side
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(width - 6, height / 2 - 2, 6, 3);
      ctx.beginPath();
      ctx.arc(width, height / 2 - 1, 4, 0, Math.PI * 2);
      ctx.fill();
      break;
    }

    case 'bubble_blower': {
      // Bubble bottle + floating iridescent bubble
      // Bottle base
      ctx.fillStyle = '#0284c7';
      ctx.fillRect(4, height - 12, 14, 12);
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(6, height - 10, 10, 8);
      // Wand handle
      ctx.fillStyle = '#f43f5e';
      ctx.fillRect(9, height - 18, 4, 7);
      ctx.beginPath();
      ctx.arc(11, height - 18, 4, 0, Math.PI * 2);
      ctx.stroke();

      // Giant floating soap bubble
      const bubbleFloatY = 7 + Math.sin(animTick * 4) * 3;
      const bubbleX = width / 2 + 8;
      const grad = ctx.createRadialGradient(bubbleX - 3, bubbleFloatY - 3, 2, bubbleX, bubbleFloatY, 11);
      grad.addColorStop(0, 'rgba(255, 255, 255, 0.85)');
      grad.addColorStop(0.4, 'rgba(56, 189, 248, 0.45)');
      grad.addColorStop(0.8, 'rgba(236, 72, 153, 0.5)');
      grad.addColorStop(1, 'rgba(168, 85, 247, 0.7)');

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(bubbleX, bubbleFloatY, 10, 0, Math.PI * 2);
      ctx.fill();

      // Bubble shimmer ring
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.2;
      ctx.stroke();

      // Specular shine
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(bubbleX - 3, bubbleFloatY - 3, 2, 0, Math.PI * 2);
      ctx.fill();
      break;
    }

    case 'banana_peel': {
      // Classic comedy yellow banana peel with splayed peels
      ctx.fillStyle = '#eab308'; // Bright yellow peel
      ctx.beginPath();
      ctx.moveTo(width / 2, 2);
      ctx.quadraticCurveTo(width / 2 - 14, height - 4, 2, height - 2);
      ctx.lineTo(8, height - 1);
      ctx.quadraticCurveTo(width / 2 - 4, height - 6, width / 2, 6);
      ctx.fill();

      // Right peel
      ctx.beginPath();
      ctx.moveTo(width / 2, 2);
      ctx.quadraticCurveTo(width / 2 + 14, height - 4, width - 2, height - 2);
      ctx.lineTo(width - 8, height - 1);
      ctx.quadraticCurveTo(width / 2 + 4, height - 6, width / 2, 6);
      ctx.fill();

      // Center peel tip
      ctx.fillStyle = '#ca8a04';
      ctx.fillRect(width / 2 - 3, height - 5, 6, 4);

      // Brown stem top
      ctx.fillStyle = '#78350f';
      ctx.fillRect(width / 2 - 2, 0, 4, 3);

      // Slick shiny streaks
      ctx.fillStyle = '#fef08a';
      ctx.fillRect(width / 2 - 8, height - 4, 4, 1.5);
      ctx.fillRect(width / 2 + 4, height - 4, 4, 1.5);
      break;
    }
  }

  // If ghost cursor, draw a pulsing placement boundary
  if (isGhost) {
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([3, 3]);
    ctx.strokeRect(-2, -3, width + 4, height + 6);
  }

  ctx.restore();
}

/**
 * Standalone React Component that renders a crisp animated pixel-art preview of a trap
 */
export const TrapVisualPreview: React.FC<{
  type: TrapType;
  width?: number;
  height?: number;
}> = ({ type, width = 80, height = 44 }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let tick = 0;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.imageSmoothingEnabled = false;

      // Draw subtle background pad
      ctx.fillStyle = 'rgba(15, 23, 42, 0.4)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Center trap in preview
      const trapInfo = TRAP_DEFINITIONS[type];
      const offsetX = (canvas.width - trapInfo.width) / 2;
      const offsetY = (canvas.height - trapInfo.height) / 2 + 2;

      drawTrapVisual(ctx, type, offsetX, offsetY, trapInfo.width, trapInfo.height, false, tick);
      tick += 0.04;
      animId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animId);
  }, [type]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className="pixelated rounded-xl bg-slate-950/70 border border-slate-700/80 shadow-inner block"
    />
  );
};

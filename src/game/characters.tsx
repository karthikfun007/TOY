/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef } from 'react';
import { CharacterId, CharacterInfo } from './types';

export const CHARACTERS: CharacterInfo[] = [
  {
    id: 'dog',
    name: 'Sir Barksalot',
    title: 'Wooden Pull-Toy Hound',
    primaryColor: '#c28148',
    secondaryColor: '#8a4b20',
    accentColor: '#ef4444',
    description: 'A cheerful wooden beagle on rolling wheels with a bouncy spring tail.',
    stats: { speed: 85, weight: 70, bounce: 90, traction: 75 },
  },
  {
    id: 'robot',
    name: 'Robo-Pip',
    title: 'Vintage Tin Automaton',
    primaryColor: '#38bdf8',
    secondaryColor: '#0284c7',
    accentColor: '#fbbf24',
    description: 'A shiny retro tin robot equipped with an antenna beacon and meter chest gauge.',
    stats: { speed: 80, weight: 95, bounce: 60, traction: 90 },
  },
  {
    id: 'crayon',
    name: 'Captain Crayon',
    title: 'Cardboard Rocket Racer',
    primaryColor: '#ef4444',
    secondaryColor: '#b91c1c',
    accentColor: '#facc15',
    description: 'An adventurous wax astronaut with a pointed tip helmet and taped paper cape.',
    stats: { speed: 92, weight: 55, bounce: 80, traction: 70 },
  },
  {
    id: 'dino',
    name: 'Dino-Block',
    title: 'Interlocking Brick Rex',
    primaryColor: '#22c55e',
    secondaryColor: '#15803d',
    accentColor: '#eab308',
    description: 'A ferocious mini dinosaur constructed from sturdy plastic building blocks.',
    stats: { speed: 75, weight: 90, bounce: 65, traction: 95 },
  },
  {
    id: 'ballerina',
    name: 'Penny Pinwheel',
    title: 'Wind-Up Music Doll',
    primaryColor: '#ec4899',
    secondaryColor: '#be185d',
    accentColor: '#e2e8f0',
    description: 'A graceful mechanical doll with a spinning brass key and layered tulle skirt.',
    stats: { speed: 88, weight: 50, bounce: 95, traction: 65 },
  },
  {
    id: 'duck',
    name: 'Turbo Duck',
    title: 'Rubber Aviator Ace',
    primaryColor: '#eab308',
    secondaryColor: '#ca8a04',
    accentColor: '#f97316',
    description: 'A daredevil yellow bath duck sporting leather goggles and a checkered scarf.',
    stats: { speed: 90, weight: 65, bounce: 85, traction: 80 },
  },
];

export function getCharacterInfo(id: CharacterId): CharacterInfo {
  return CHARACTERS.find((c) => c.id === id) || CHARACTERS[0];
}

/**
 * Procedural Pixel-Art Sprite Renderer
 * Draws the character onto the canvas context with crisp pixel proportions,
 * facing direction, running leg bob, jump stretch, and status effect overlays.
 */
export function drawCharacter(
  ctx: CanvasRenderingContext2D,
  charId: CharacterId,
  x: number,
  y: number,
  facing: 1 | -1,
  runCycle: number,
  isGrounded: boolean,
  isJumping: boolean,
  squishX: number,
  squishY: number,
  statusEffect: 'none' | 'slimed' | 'launched',
  colorVariant: number = 0
) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(facing * squishX, squishY);

  const bob = isGrounded ? Math.sin(runCycle * 10) * 2 : 0;
  const legSwing = isGrounded ? Math.sin(runCycle * 10) * 6 : isJumping ? -3 : 0;

  // Status effect aura (e.g. green drip if slimed)
  if (statusEffect === 'slimed') {
    ctx.fillStyle = 'rgba(74, 222, 128, 0.45)';
    ctx.beginPath();
    ctx.arc(0, -16 + bob, 22, 0, Math.PI * 2);
    ctx.fill();
  } else if (statusEffect === 'launched') {
    ctx.fillStyle = 'rgba(251, 191, 36, 0.4)';
    ctx.beginPath();
    ctx.arc(0, -16 + bob, 22, 0, Math.PI * 2);
    ctx.fill();
  }

  switch (charId) {
    case 'dog': {
      // Body (wood block)
      ctx.fillStyle = colorVariant === 1 ? '#a86230' : '#c28148';
      ctx.fillRect(-12, -22 + bob, 24, 14);

      // Wood grain stripe
      ctx.fillStyle = '#8a4b20';
      ctx.fillRect(-8, -20 + bob, 4, 10);
      ctx.fillRect(2, -19 + bob, 3, 8);

      // Head & snout
      ctx.fillStyle = '#d4965e';
      ctx.fillRect(4, -30 + bob, 14, 12);
      ctx.fillStyle = '#8a4b20';
      ctx.fillRect(16, -26 + bob, 4, 4); // nose

      // Ear
      ctx.fillStyle = '#5c3114';
      ctx.fillRect(2, -28 + bob, 5, 10);

      // Eye
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(11, -27 + bob, 3, 3);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(11, -27 + bob, 1, 1);

      // Red collar
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(3, -20 + bob, 5, 4);

      // Spring tail
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-12, -18 + bob);
      ctx.lineTo(-18, -24 + bob + Math.sin(runCycle * 14) * 4);
      ctx.stroke();

      // Wooden wheels (legs)
      ctx.fillStyle = '#78350f';
      ctx.beginPath();
      ctx.arc(-8 + legSwing * 0.5, -4, 4, 0, Math.PI * 2);
      ctx.arc(8 - legSwing * 0.5, -4, 4, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#fbbf24';
      ctx.fillRect(-9 + legSwing * 0.5, -5, 2, 2);
      ctx.fillRect(7 - legSwing * 0.5, -5, 2, 2);
      break;
    }

    case 'robot': {
      // Torso
      ctx.fillStyle = colorVariant === 1 ? '#0284c7' : '#38bdf8';
      ctx.fillRect(-11, -24 + bob, 22, 16);

      // Chest gauge
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(-7, -20 + bob, 14, 8);
      ctx.fillStyle = '#22c55e';
      ctx.fillRect(-5, -18 + bob, 10, 4);
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(-1 + Math.sin(runCycle * 8) * 3, -19 + bob, 2, 6);

      // Head
      ctx.fillStyle = '#7dd3fc';
      ctx.fillRect(-8, -34 + bob, 16, 10);

      // Eye screen
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(-5, -31 + bob, 11, 4);
      ctx.fillStyle = '#fde047';
      ctx.fillRect(-4, -30 + bob, 3, 2);
      ctx.fillRect(2, -30 + bob, 3, 2);

      // Antenna
      ctx.fillStyle = '#94a3b8';
      ctx.fillRect(-1, -39 + bob, 2, 5);
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(0, -40 + bob, 3, 0, Math.PI * 2);
      ctx.fill();

      // Metal arms
      ctx.fillStyle = '#64748b';
      ctx.fillRect(8, -20 + bob - legSwing * 0.6, 5, 9);

      // Boxy tread feet
      ctx.fillStyle = '#334155';
      ctx.fillRect(-10 - legSwing, -6, 8, 6);
      ctx.fillRect(2 + legSwing, -6, 8, 6);
      break;
    }

    case 'crayon': {
      // Crayon body (hexagonal paper tube)
      ctx.fillStyle = colorVariant === 1 ? '#dc2626' : '#ef4444';
      ctx.fillRect(-9, -24 + bob, 18, 16);

      // Paper wrapper
      ctx.fillStyle = '#fef08a';
      ctx.fillRect(-9, -21 + bob, 18, 10);
      ctx.fillStyle = '#0f172a';
      // Retro wavy oval logo on wrapper
      ctx.fillRect(-4, -18 + bob, 8, 4);

      // Sharpened cone head
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.moveTo(-9, -24 + bob);
      ctx.lineTo(0, -38 + bob);
      ctx.lineTo(9, -24 + bob);
      ctx.closePath();
      ctx.fill();

      // Astronaut visor over cone
      ctx.fillStyle = '#0284c7';
      ctx.fillRect(-5, -29 + bob, 10, 4);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(-3, -28 + bob, 3, 1);

      // Paper cape behind
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.moveTo(-8, -22 + bob);
      ctx.lineTo(-18 - Math.abs(legSwing) * 1.2, -14 + bob);
      ctx.lineTo(-7, -10 + bob);
      ctx.closePath();
      ctx.fill();

      // Boots
      ctx.fillStyle = '#991b1b';
      ctx.fillRect(-8 - legSwing, -6, 6, 6);
      ctx.fillRect(2 + legSwing, -6, 6, 6);
      break;
    }

    case 'dino': {
      // Chunky plastic block body
      ctx.fillStyle = colorVariant === 1 ? '#16a34a' : '#22c55e';
      ctx.fillRect(-12, -22 + bob, 24, 15);

      // Stud bumps on top
      ctx.fillStyle = '#15803d';
      ctx.fillRect(-10, -25 + bob, 4, 3);
      ctx.fillRect(-4, -25 + bob, 4, 3);
      ctx.fillRect(2, -25 + bob, 4, 3);

      // Big snout
      ctx.fillStyle = '#4ade80';
      ctx.fillRect(4, -30 + bob, 14, 12);
      ctx.fillStyle = '#15803d';
      ctx.fillRect(6, -33 + bob, 4, 3); // head stud

      // Eye
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(8, -27 + bob, 3, 3);
      ctx.fillStyle = '#facc15';
      ctx.fillRect(9, -26 + bob, 1, 1);

      // Sharp white teeth
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(10, -19 + bob, 2, 2);
      ctx.fillRect(14, -19 + bob, 2, 2);

      // Tail block
      ctx.fillStyle = '#16a34a';
      ctx.fillRect(-18, -17 + bob + Math.sin(runCycle * 10) * 2, 7, 6);

      // Block legs
      ctx.fillStyle = '#166534';
      ctx.fillRect(-10 - legSwing, -6, 7, 7);
      ctx.fillRect(3 + legSwing, -6, 7, 7);
      break;
    }

    case 'ballerina': {
      // Dress bodice
      ctx.fillStyle = colorVariant === 1 ? '#db2777' : '#ec4899';
      ctx.fillRect(-7, -23 + bob, 14, 11);

      // Tulle skirt
      ctx.fillStyle = '#f472b6';
      ctx.beginPath();
      ctx.moveTo(-14, -12 + bob);
      ctx.lineTo(14, -12 + bob);
      ctx.lineTo(10, -5 + bob);
      ctx.lineTo(-10, -5 + bob);
      ctx.closePath();
      ctx.fill();

      // Head
      ctx.fillStyle = '#fce7f3';
      ctx.fillRect(-6, -32 + bob, 12, 10);

      // Hair bun
      ctx.fillStyle = '#78350f';
      ctx.fillRect(-7, -35 + bob, 14, 4);
      ctx.beginPath();
      ctx.arc(0, -36 + bob, 4, 0, Math.PI * 2);
      ctx.fill();

      // Cheerful face
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, -28 + bob, 2, 2);
      ctx.fillStyle = '#f43f5e';
      ctx.fillRect(-2, -26 + bob, 2, 1); // blush
      ctx.fillRect(3, -26 + bob, 2, 1);

      // Brass wind-up key on back
      ctx.fillStyle = '#fbbf24';
      ctx.fillRect(-12, -20 + bob, 5, 2);
      ctx.beginPath();
      ctx.arc(-14, -19 + bob, 4, 0, Math.PI * 2);
      ctx.fill();

      // Dainty legs & ballet shoes
      ctx.fillStyle = '#fce7f3';
      ctx.fillRect(-5 - legSwing * 0.7, -5, 3, 6);
      ctx.fillRect(2 + legSwing * 0.7, -5, 3, 6);
      ctx.fillStyle = '#ec4899';
      ctx.fillRect(-6 - legSwing * 0.7, 0, 4, 2);
      ctx.fillRect(1 + legSwing * 0.7, 0, 4, 2);
      break;
    }

    case 'duck': {
      // Duck body
      ctx.fillStyle = colorVariant === 1 ? '#ca8a04' : '#eab308';
      ctx.beginPath();
      ctx.ellipse(0, -14 + bob, 13, 9, 0, 0, Math.PI * 2);
      ctx.fill();

      // Round head
      ctx.beginPath();
      ctx.arc(6, -24 + bob, 8, 0, Math.PI * 2);
      ctx.fill();

      // Orange beak
      ctx.fillStyle = '#f97316';
      ctx.beginPath();
      ctx.moveTo(12, -25 + bob);
      ctx.lineTo(20, -22 + bob);
      ctx.lineTo(12, -20 + bob);
      ctx.closePath();
      ctx.fill();

      // Aviator goggles strap & lens
      ctx.fillStyle = '#78350f';
      ctx.fillRect(1, -26 + bob, 11, 4);
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(5, -26 + bob, 5, 4);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(6, -26 + bob, 2, 2);

      // Checkered scarf
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(0, -18 + bob, 9, 4);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(3, -18 + bob, 3, 4);

      // Propeller beanie hat
      ctx.fillStyle = '#3b82f6';
      ctx.fillRect(4, -32 + bob, 5, 2);
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(6, -34 + bob, 1, 3);
      // Spinning blades
      ctx.fillStyle = '#fbbf24';
      const propAngle = runCycle * 15;
      ctx.save();
      ctx.translate(6.5, -34 + bob);
      ctx.rotate(propAngle);
      ctx.fillRect(-6, -1, 12, 2);
      ctx.restore();

      // Webbed flipper feet
      ctx.fillStyle = '#ea580c';
      ctx.fillRect(-7 - legSwing, -4, 6, 4);
      ctx.fillRect(2 + legSwing, -4, 6, 4);
      break;
    }
  }

  ctx.restore();
}

/**
 * Standalone React Component that renders an animated, crisp pixel-art preview of a character
 */
export const CharacterVisualPreview: React.FC<{
  charId: CharacterId;
  scale?: number;
  animated?: boolean;
  width?: number;
  height?: number;
  className?: string;
}> = ({ charId, scale = 1.6, animated = true, width = 72, height = 72, className = '' }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let runCycle = 0;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.imageSmoothingEnabled = false;

      ctx.save();
      // Center character in canvas
      ctx.translate(canvas.width / 2, canvas.height - 12);
      ctx.scale(scale, scale);

      drawCharacter(
        ctx,
        charId,
        0,
        0,
        1,
        runCycle,
        true,
        false,
        1,
        1,
        'none',
        0
      );
      ctx.restore();

      if (animated) {
        runCycle += 0.04;
      }
      animId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animId);
  }, [charId, scale, animated]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className={`pixelated block ${className}`}
    />
  );
};

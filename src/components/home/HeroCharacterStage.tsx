/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Sparkles, Smile, Footprints, PartyPopper } from 'lucide-react';
import { CHARACTERS, drawCharacter, getCharacterInfo } from '../../game/characters';
import { CharacterId } from '../../game/types';
import { audio } from '../../game/audio';

interface HeroCharacterStageProps {
  selectedChar: CharacterId;
  onSelectCharacter: (charId: CharacterId) => void;
}

export const HeroCharacterStage: React.FC<HeroCharacterStageProps> = ({
  selectedChar,
  onSelectCharacter,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [animMode, setAnimMode] = useState<'idle' | 'run' | 'celebrate'>('idle');
  const [isHovered, setIsHovered] = useState(false);
  const [celebrationTime, setCelebrationTime] = useState(0);

  const activeChar = getCharacterInfo(selectedChar);
  const charIndex = CHARACTERS.findIndex((c) => c.id === selectedChar);

  const handlePrevChar = () => {
    audio.playButtonClick();
    const nextIdx = (charIndex - 1 + CHARACTERS.length) % CHARACTERS.length;
    onSelectCharacter(CHARACTERS[nextIdx].id);
    triggerCheer();
  };

  const handleNextChar = () => {
    audio.playButtonClick();
    const nextIdx = (charIndex + 1) % CHARACTERS.length;
    onSelectCharacter(CHARACTERS[nextIdx].id);
    triggerCheer();
  };

  const triggerCheer = () => {
    setAnimMode('celebrate');
    setCelebrationTime(Date.now());
    audio.playJump();
    setTimeout(() => {
      setAnimMode('idle');
    }, 1800);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let runCycle = 0;
    let jumpY = 0;
    let jumpVy = 0;
    let squishX = 1;
    let squishY = 1;
    let isJumping = false;
    let isGrounded = true;

    // Burst sparkles for celebration
    interface Sparkle {
      x: number;
      y: number;
      vx: number;
      vy: number;
      life: number;
      maxLife: number;
      color: string;
      size: number;
    }
    const sparkles: Sparkle[] = [];

    const spawnSparkles = (count: number) => {
      const colors = ['#fde047', '#38bdf8', '#f43f5e', '#a855f7', '#4ade80'];
      for (let i = 0; i < count; i++) {
        const angle = -Math.PI / 2 + (Math.random() - 0.5) * 1.5;
        const speed = Math.random() * 140 + 60;
        sparkles.push({
          x: canvas.width / 2 + (Math.random() - 0.5) * 40,
          y: canvas.height * 0.72,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          life: 0.6 + Math.random() * 0.4,
          maxLife: 1.0,
          color: colors[Math.floor(Math.random() * colors.length)],
          size: Math.random() * 4 + 2,
        });
      }
    };

    let prevTime = performance.now();

    const render = (now: number) => {
      const dt = Math.min((now - prevTime) / 1000, 0.1);
      prevTime = now;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.imageSmoothingEnabled = false;

      const cw = canvas.width;
      const ch = canvas.height;
      const centerX = cw / 2;
      const groundY = ch * 0.78;

      // 1. Draw 3D Stylized Pedestal Stage
      const pedestalRadiusX = 130;
      const pedestalRadiusY = 46;
      const pedestalHeight = 32;

      // Pedestal glow aura
      const glowGrad = ctx.createRadialGradient(
        centerX,
        groundY + 10,
        20,
        centerX,
        groundY + 10,
        pedestalRadiusX * 1.3
      );
      glowGrad.addColorStop(0, `${activeChar.primaryColor}55`);
      glowGrad.addColorStop(0.6, `${activeChar.accentColor}25`);
      glowGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = glowGrad;
      ctx.beginPath();
      ctx.ellipse(centerX, groundY + 12, pedestalRadiusX * 1.3, pedestalRadiusY * 1.3, 0, 0, Math.PI * 2);
      ctx.fill();

      // Pedestal Base / Cylinder Extrusion
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.ellipse(centerX, groundY + pedestalHeight, pedestalRadiusX, pedestalRadiusY, 0, 0, Math.PI);
      ctx.lineTo(centerX - pedestalRadiusX, groundY);
      ctx.ellipse(centerX, groundY, pedestalRadiusX, pedestalRadiusY, 0, Math.PI, 0, true);
      ctx.closePath();
      ctx.fill();

      // Pedestal Front Bevel with Segmented Toy Studs
      const bevelGrad = ctx.createLinearGradient(0, groundY, 0, groundY + pedestalHeight);
      bevelGrad.addColorStop(0, activeChar.primaryColor);
      bevelGrad.addColorStop(1, '#020617');
      ctx.fillStyle = bevelGrad;
      ctx.beginPath();
      ctx.ellipse(centerX, groundY + pedestalHeight, pedestalRadiusX, pedestalRadiusY, 0, 0, Math.PI);
      ctx.lineTo(centerX - pedestalRadiusX, groundY);
      ctx.ellipse(centerX, groundY, pedestalRadiusX, pedestalRadiusY, 0, Math.PI, 0, true);
      ctx.closePath();
      ctx.fill();

      // Golden Rim Edge
      ctx.strokeStyle = activeChar.accentColor;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.ellipse(centerX, groundY, pedestalRadiusX, pedestalRadiusY, 0, 0, Math.PI * 2);
      ctx.stroke();

      // Pedestal Top Surface Disc
      const topDiscGrad = ctx.createRadialGradient(
        centerX,
        groundY - 10,
        10,
        centerX,
        groundY,
        pedestalRadiusX
      );
      topDiscGrad.addColorStop(0, '#1e293b');
      topDiscGrad.addColorStop(0.7, '#0f172a');
      topDiscGrad.addColorStop(1, activeChar.secondaryColor);
      ctx.fillStyle = topDiscGrad;
      ctx.beginPath();
      ctx.ellipse(centerX, groundY, pedestalRadiusX - 3, pedestalRadiusY - 2, 0, 0, Math.PI * 2);
      ctx.fill();

      // Inner Star Emblem on Pedestal Surface
      ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
      ctx.beginPath();
      ctx.ellipse(centerX, groundY, pedestalRadiusX * 0.6, pedestalRadiusY * 0.6, 0, 0, Math.PI * 2);
      ctx.fill();

      // Character Contact Shadow
      const shadowScale = Math.max(0.4, 1 - Math.abs(jumpY) / 120);
      ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
      ctx.beginPath();
      ctx.ellipse(
        centerX,
        groundY - 4,
        48 * shadowScale,
        16 * shadowScale,
        0,
        0,
        Math.PI * 2
      );
      ctx.fill();

      // 2. Physics & Animation Update
      if (animMode === 'celebrate') {
        // High celebratory cartoon jump loop
        if (isGrounded) {
          jumpVy = -480;
          isGrounded = false;
          isJumping = true;
          squishX = 0.8;
          squishY = 1.3;
          spawnSparkles(12);
        } else {
          jumpVy += 1100 * dt; // Gravity
          jumpY += jumpVy * dt;

          if (jumpY >= 0) {
            jumpY = 0;
            jumpVy = 0;
            isGrounded = true;
            isJumping = false;
            squishX = 1.3;
            squishY = 0.75;
          }
        }
        runCycle += dt * 3;
      } else if (animMode === 'run') {
        runCycle += dt * 14;
        jumpY = 0;
        isJumping = false;
        isGrounded = true;
        squishX = 1 + Math.sin(runCycle * 5) * 0.05;
        squishY = 1 - Math.sin(runCycle * 5) * 0.05;
      } else {
        // Idle: gentle breathing bob
        runCycle += dt * 1.5;
        jumpY = Math.sin(runCycle * 3) * 3;
        isJumping = false;
        isGrounded = true;
        squishX = 1 + Math.sin(runCycle * 3) * 0.02;
        squishY = 1 - Math.sin(runCycle * 3) * 0.02;

        // Occasional playful mini-hop every 6 seconds
        if (Math.sin(runCycle * 0.5) > 0.98 && isGrounded) {
          jumpY = -12;
        }
      }

      // Smooth recovery from squish
      squishX += (1 - squishX) * 0.15;
      squishY += (1 - squishY) * 0.15;

      // 3. Draw Character on Stage
      ctx.save();
      const charScale = 3.8;
      ctx.translate(centerX, groundY + jumpY);
      ctx.scale(charScale, charScale);

      drawCharacter(
        ctx,
        selectedChar,
        0,
        0,
        1,
        runCycle,
        isGrounded,
        isJumping,
        squishX,
        squishY,
        'none',
        0
      );
      ctx.restore();

      // 4. Update & Draw Sparkles
      for (let i = sparkles.length - 1; i >= 0; i--) {
        const sp = sparkles[i];
        sp.x += sp.vx * dt;
        sp.y += sp.vy * dt;
        sp.vy += 180 * dt;
        sp.life -= dt;

        if (sp.life <= 0) {
          sparkles.splice(i, 1);
          continue;
        }

        const alpha = sp.life / sp.maxLife;
        ctx.fillStyle = sp.color;
        ctx.globalAlpha = alpha;
        ctx.beginPath();
        ctx.arc(sp.x, sp.y, sp.size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => cancelAnimationFrame(animId);
  }, [selectedChar, animMode, celebrationTime]);

  return (
    <div className="relative flex flex-col items-center justify-center w-full max-w-xl mx-auto select-none">
      {/* Interactive Stage Canvas */}
      <div
        className="relative cursor-pointer group"
        onClick={triggerCheer}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        title="Click your racer to celebrate!"
      >
        <canvas
          ref={canvasRef}
          width={420}
          height={330}
          className="pixelated block drop-shadow-[0_12px_24px_rgba(0,0,0,0.6)] transform group-hover:scale-[1.02] transition-transform duration-200"
        />

        {/* Hover Hint Bubble */}
        <div
          className={`absolute top-4 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-slate-900/90 border border-amber-400 text-amber-300 font-toy text-xs shadow-lg pointer-events-none transition-all duration-200 flex items-center gap-1.5 ${
            isHovered ? 'opacity-100 -translate-y-1' : 'opacity-0 translate-y-2'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-yellow-400 animate-spin" />
          <span>Click to cheer!</span>
        </div>

        {/* Carousel Browse Arrows */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            handlePrevChar();
          }}
          className="absolute left-2 top-1/2 -translate-y-1/2 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-b from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black border-2 border-amber-300 border-b-4 border-b-amber-700 shadow-xl transition-all active:border-b-0 active:translate-y-0.5 cursor-pointer z-10"
          title="Previous Character"
        >
          <ChevronLeft className="w-7 h-7 stroke-[3]" />
        </button>

        <button
          onClick={(e) => {
            e.stopPropagation();
            handleNextChar();
          }}
          className="absolute right-2 top-1/2 -translate-y-1/2 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-b from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black border-2 border-amber-300 border-b-4 border-b-amber-700 shadow-xl transition-all active:border-b-0 active:translate-y-0.5 cursor-pointer z-10"
          title="Next Character"
        >
          <ChevronRight className="w-7 h-7 stroke-[3]" />
        </button>
      </div>

      {/* Character Identity Card & Animation Mode Selectors */}
      <div className="w-full max-w-md -mt-4 bg-gradient-to-b from-slate-900/95 via-indigo-950/90 to-slate-950/95 border-3 border-amber-400/80 rounded-3xl p-4 shadow-2xl backdrop-blur-md text-center space-y-2.5 z-10">
        <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-2.5">
          <span className="text-xs font-poppins font-black text-amber-300 tracking-wider">
            RACER #{charIndex + 1} OF {CHARACTERS.length}
          </span>

          {/* Animation Pose Toggles */}
          <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-slate-950/80 border border-slate-800">
            <button
              onClick={() => {
                audio.playButtonClick();
                setAnimMode('idle');
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-poppins font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                animMode === 'idle'
                  ? 'bg-amber-400 text-slate-950 shadow-md border-b-2 border-amber-600'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <Smile className="w-3.5 h-3.5" />
              <span>Idle</span>
            </button>
            <button
              onClick={() => {
                audio.playButtonClick();
                setAnimMode('run');
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-poppins font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                animMode === 'run'
                  ? 'bg-sky-400 text-slate-950 shadow-md border-b-2 border-sky-600'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <Footprints className="w-3.5 h-3.5" />
              <span>Run</span>
            </button>
            <button
              onClick={() => {
                triggerCheer();
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-poppins font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                animMode === 'celebrate'
                  ? 'bg-rose-400 text-slate-950 shadow-md border-b-2 border-rose-600 animate-bounce'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <PartyPopper className="w-3.5 h-3.5" />
              <span>Cheer</span>
            </button>
          </div>
        </div>

        {/* Character Title & Description */}
        <div>
          <h2 className="font-toy text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-400 drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">
            {activeChar.name}
          </h2>
          <p className="font-arcade text-[10px] text-cyan-300 tracking-wide mt-1 uppercase">{activeChar.title}</p>
          <p className="font-poppins text-xs text-slate-200/90 leading-relaxed mt-1 max-w-sm mx-auto">
            {activeChar.description}
          </p>

          {/* 16-Bit Arcade Character Stat Ratings */}
          {activeChar.stats && (
            <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 mt-3 pt-2.5 border-t border-white/10 text-left">
              <div>
                <div className="flex justify-between text-[9px] font-arcade text-cyan-300 mb-0.5">
                  <span>SPEED</span>
                  <span>{activeChar.stats.speed}</span>
                </div>
                <div className="h-2 w-full rounded bg-slate-950 border border-slate-700 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-cyan-500 to-sky-400"
                    style={{ width: `${activeChar.stats.speed}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-[9px] font-arcade text-amber-300 mb-0.5">
                  <span>WEIGHT</span>
                  <span>{activeChar.stats.weight}</span>
                </div>
                <div className="h-2 w-full rounded bg-slate-950 border border-slate-700 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-amber-500 to-orange-400"
                    style={{ width: `${activeChar.stats.weight}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-[9px] font-arcade text-rose-300 mb-0.5">
                  <span>BOUNCE</span>
                  <span>{activeChar.stats.bounce}</span>
                </div>
                <div className="h-2 w-full rounded bg-slate-950 border border-slate-700 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-rose-500 to-pink-400"
                    style={{ width: `${activeChar.stats.bounce}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-[9px] font-arcade text-emerald-300 mb-0.5">
                  <span>TRACTION</span>
                  <span>{activeChar.stats.traction}</span>
                </div>
                <div className="h-2 w-full rounded bg-slate-950 border border-slate-700 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-500 to-green-400"
                    style={{ width: `${activeChar.stats.traction}%` }}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

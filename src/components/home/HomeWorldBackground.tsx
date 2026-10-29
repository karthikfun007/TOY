/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef } from 'react';

interface FloatingBlock {
  x: number;
  y: number;
  baseY: number;
  size: number;
  color: string;
  topColor: string;
  sideColor: string;
  label: string;
  speed: number;
  phase: number;
  rotSpeed: number;
  rot: number;
  depth: number;
}

interface FloatingCloud {
  x: number;
  y: number;
  speed: number;
  scale: number;
  alpha: number;
}

interface StarParticle {
  x: number;
  y: number;
  size: number;
  alpha: number;
  speed: number;
  twinkleSpeed: number;
  phase: number;
  color: string;
}

export const HomeWorldBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let width = 0;
    let height = 0;

    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);
    };

    resize();
    window.addEventListener('resize', resize);

    // Seed Floating Toy Blocks
    const blockColors = [
      { top: '#38bdf8', front: '#0284c7', side: '#0369a1', char: 'FUN' },
      { top: '#f43f5e', front: '#e11d48', side: '#be123c', char: '1UP' },
      { top: '#fbbf24', front: '#f59e0b', side: '#d97706', char: '★' },
      { top: '#a855f7', front: '#9333ea', side: '#7e22ce', char: 'WIN' },
      { top: '#4ade80', front: '#22c55e', side: '#16a34a', char: 'GO!' },
      { top: '#fb7185', front: '#f43f5e', side: '#e11d48', char: 'TOY' },
    ];

    const blocks: FloatingBlock[] = [];
    const count = Math.min(8, Math.max(5, Math.floor(width / 220)));

    for (let i = 0; i < count; i++) {
      const col = blockColors[i % blockColors.length];
      const depth = 0.5 + Math.random() * 0.5;
      const size = (28 + Math.random() * 24) * depth;
      const baseX = (width / count) * i + Math.random() * 60;
      const baseY = height * (0.15 + Math.random() * 0.45);

      blocks.push({
        x: baseX,
        y: baseY,
        baseY,
        size,
        color: col.front,
        topColor: col.top,
        sideColor: col.side,
        label: col.char,
        speed: 0.6 + Math.random() * 0.8,
        phase: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 0.008,
        rot: (Math.random() - 0.5) * 0.3,
        depth,
      });
    }

    // Seed Floating Clouds
    const clouds: FloatingCloud[] = [
      { x: width * 0.1, y: height * 0.12, speed: 12, scale: 0.9, alpha: 0.2 },
      { x: width * 0.55, y: height * 0.08, speed: 8, scale: 1.2, alpha: 0.25 },
      { x: width * 0.85, y: height * 0.18, speed: 15, scale: 0.8, alpha: 0.18 },
    ];

    // Seed Twinkling Stars & Confetti
    const stars: StarParticle[] = [];
    const starColors = ['#fef08a', '#67e8f9', '#f472b6', '#a7f3d0', '#fde047'];
    for (let i = 0; i < 35; i++) {
      stars.push({
        x: Math.random() * width,
        y: Math.random() * height,
        size: Math.random() * 2.5 + 1.5,
        alpha: Math.random() * 0.7 + 0.3,
        speed: Math.random() * 15 + 8,
        twinkleSpeed: Math.random() * 2 + 1,
        phase: Math.random() * Math.PI * 2,
        color: starColors[Math.floor(Math.random() * starColors.length)],
      });
    }

    let lastTime = performance.now();

    const drawIsometricCube = (
      c: CanvasRenderingContext2D,
      bx: number,
      by: number,
      s: number,
      colTop: string,
      colFront: string,
      colSide: string,
      label: string,
      tilt: number
    ) => {
      c.save();
      c.translate(bx, by);
      c.rotate(tilt);

      const hs = s * 0.5;
      const isoH = s * 0.35;

      // Soft drop shadow
      c.fillStyle = 'rgba(0, 0, 0, 0.18)';
      c.beginPath();
      c.ellipse(0, s * 0.9, s * 0.8, s * 0.3, 0, 0, Math.PI * 2);
      c.fill();

      // Top Face
      c.fillStyle = colTop;
      c.beginPath();
      c.moveTo(0, -isoH * 2);
      c.lineTo(hs * 1.4, -isoH);
      c.lineTo(0, 0);
      c.lineTo(-hs * 1.4, -isoH);
      c.closePath();
      c.fill();

      // Left / Front Face
      c.fillStyle = colFront;
      c.beginPath();
      c.moveTo(-hs * 1.4, -isoH);
      c.lineTo(0, 0);
      c.lineTo(0, s * 0.85);
      c.lineTo(-hs * 1.4, s * 0.85 - isoH);
      c.closePath();
      c.fill();

      // Right / Side Face
      c.fillStyle = colSide;
      c.beginPath();
      c.moveTo(0, 0);
      c.lineTo(hs * 1.4, -isoH);
      c.lineTo(hs * 1.4, s * 0.85 - isoH);
      c.lineTo(0, s * 0.85);
      c.closePath();
      c.fill();

      // Stud circle on top (LEGO / building block feel)
      c.fillStyle = 'rgba(255, 255, 255, 0.35)';
      c.beginPath();
      c.ellipse(0, -isoH, hs * 0.55, isoH * 0.45, 0, 0, Math.PI * 2);
      c.fill();

      // Label text on the front face
      c.fillStyle = 'rgba(255, 255, 255, 0.95)';
      c.font = `900 ${Math.floor(s * 0.44)}px 'Poppins', 'Fredoka', sans-serif`;
      c.textAlign = 'center';
      c.textBaseline = 'middle';
      c.fillText(label, -hs * 0.6, s * 0.35);

      c.restore();
    };

    const drawCartoonCloud = (c: CanvasRenderingContext2D, cx: number, cy: number, scale: number, alpha: number) => {
      c.save();
      c.fillStyle = `rgba(255, 255, 255, ${alpha})`;
      c.translate(cx, cy);
      c.scale(scale, scale);

      c.beginPath();
      c.arc(0, 0, 28, 0, Math.PI * 2);
      c.arc(32, -8, 22, 0, Math.PI * 2);
      c.arc(-28, -6, 20, 0, Math.PI * 2);
      c.arc(52, 4, 16, 0, Math.PI * 2);
      c.arc(-46, 4, 16, 0, Math.PI * 2);
      c.fill();

      c.restore();
    };

    const render = (now: number) => {
      const dt = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;

      // Only draw if tab is visible
      if (!document.hidden) {
        ctx.clearRect(0, 0, width, height);

        // 1. Vibrant Cartoon Gradient: Sunny twilight into electric violet and candy magenta
        const skyGrad = ctx.createLinearGradient(0, 0, 0, height);
        skyGrad.addColorStop(0, '#1e1b4b');
        skyGrad.addColorStop(0.3, '#312e81');
        skyGrad.addColorStop(0.62, '#581c87');
        skyGrad.addColorStop(0.88, '#831843');
        skyGrad.addColorStop(1, '#1e1b4b');
        ctx.fillStyle = skyGrad;
        ctx.fillRect(0, 0, width, height);

        // 2. Playful Ambient Cartoon Sunbeam / Spotlight
        const spotGrad = ctx.createRadialGradient(
          width * 0.5,
          -40,
          30,
          width * 0.5,
          height * 0.6,
          Math.max(width, height) * 0.8
        );
        spotGrad.addColorStop(0, 'rgba(253, 224, 71, 0.28)');
        spotGrad.addColorStop(0.4, 'rgba(56, 189, 248, 0.16)');
        spotGrad.addColorStop(0.75, 'rgba(244, 63, 94, 0.1)');
        spotGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = spotGrad;
        ctx.fillRect(0, 0, width, height);

        // 3. Subtle Polka-Dot Wallpaper Pattern (Toy Room Aesthetic)
        ctx.fillStyle = 'rgba(254, 240, 138, 0.04)';
        const dotGap = 42;
        for (let x = 15; x < width; x += dotGap) {
          for (let y = 15; y < height * 0.75; y += dotGap) {
            ctx.beginPath();
            ctx.arc(x, y, 1.5, 0, Math.PI * 2);
            ctx.fill();
          }
        }

        // 4. Update & Draw Clouds
        for (const cloud of clouds) {
          cloud.x += cloud.speed * dt;
          if (cloud.x > width + 100) {
            cloud.x = -120;
          }
          drawCartoonCloud(ctx, cloud.x, cloud.y, cloud.scale, cloud.alpha);
        }

        // 5. Update & Draw Floating Toy Blocks
        const t = now * 0.0015;
        for (const b of blocks) {
          b.y = b.baseY + Math.sin(t * b.speed + b.phase) * (14 * b.depth);
          b.rot += b.rotSpeed;
          drawIsometricCube(ctx, b.x, b.y, b.size, b.topColor, b.color, b.sideColor, b.label, b.rot);
        }

        // 6. Update & Draw Twinkling Ambient Stars & Confetti
        for (const star of stars) {
          star.y -= star.speed * dt;
          if (star.y < -10) {
            star.y = height + 10;
            star.x = Math.random() * width;
          }

          const twinkle = (Math.sin(now * 0.003 * star.twinkleSpeed + star.phase) + 1) * 0.5;
          const currentAlpha = star.alpha * (0.35 + 0.65 * twinkle);

          ctx.fillStyle = star.color;
          ctx.globalAlpha = currentAlpha;

          // 4-pointed retro twinkle star
          ctx.beginPath();
          const s = star.size;
          ctx.moveTo(star.x, star.y - s);
          ctx.lineTo(star.x + s * 0.35, star.y - s * 0.35);
          ctx.lineTo(star.x + s, star.y);
          ctx.lineTo(star.x + s * 0.35, star.y + s * 0.35);
          ctx.lineTo(star.x, star.y + s);
          ctx.lineTo(star.x - s * 0.35, star.y + s * 0.35);
          ctx.lineTo(star.x - s, star.y);
          ctx.lineTo(star.x - s * 0.35, star.y - s * 0.35);
          ctx.closePath();
          ctx.fill();
        }
        ctx.globalAlpha = 1;

        // 7. Ground / Arena Floor Gradient
        const floorH = height * 0.32;
        const floorGrad = ctx.createLinearGradient(0, height - floorH, 0, height);
        floorGrad.addColorStop(0, 'rgba(15, 23, 42, 0.92)');
        floorGrad.addColorStop(0.3, 'rgba(30, 27, 75, 0.95)');
        floorGrad.addColorStop(1, 'rgba(15, 23, 42, 1)');
        ctx.fillStyle = floorGrad;
        ctx.fillRect(0, height - floorH, width, floorH);

        // Floor Border Bevel Highlight
        ctx.fillStyle = 'rgba(251, 191, 36, 0.3)';
        ctx.fillRect(0, height - floorH, width, 3);
        ctx.fillStyle = 'rgba(56, 189, 248, 0.15)';
        ctx.fillRect(0, height - floorH + 3, width, 1);
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none fixed inset-0 z-0 h-full w-full"
    />
  );
};

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import { Volume2, VolumeX, BookOpen, Flag, Trophy, ShieldAlert, Sparkles } from 'lucide-react';
import { audio } from '../game/audio';
import { SharedGroupCamera } from '../game/camera';
import { getWorldById } from '../game/worlds';
import { network } from '../game/network';
import { updateCollapsingPlatforms, updateMovingHazards } from '../game/physics';
import { GameRenderer } from '../game/renderer';
import { PlayerInput, RoomState, TrapType } from '../game/types';
import { TrapPlacementOverlay } from './TrapPlacementOverlay';
import { WorldTransitionScreen } from './WorldTransitionScreen';

interface GameCanvasProps {
  room: RoomState;
  localPlayerId: string;
  onOpenAudioSettings: () => void;
}

export const GameCanvas: React.FC<GameCanvasProps> = ({
  room,
  localPlayerId,
  onOpenAudioSettings,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const cameraRef = useRef<SharedGroupCamera>(new SharedGroupCamera());
  const rendererRef = useRef<GameRenderer>(new GameRenderer());

  const [isMuted, setIsMuted] = useState(false);
  const [selectedAnchorId, setSelectedAnchorId] = useState<string | null>(null);
  const [selectedTrapType, setSelectedTrapType] = useState<TrapType>('spring');
  const [cursorWorldPos, setCursorWorldPos] = useState<{ x: number; y: number } | null>(null);
  const cursorWorldRef = useRef<{ x: number; y: number } | null>(null);

  // Input state refs (persisted without re-renders)
  const inputRef = useRef<PlayerInput>({
    left: false,
    right: false,
    jump: false,
    jumpPressed: false,
  });

  const lastTimeRef = useRef<number>(performance.now());
  const countdownPlayedRef = useRef<number>(-1);
  const prevPlayersRef = useRef<Record<string, { checkpoint: number; finished: boolean; status: string }>>({});

  // Keyboard Event Listeners
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent default scrolling on game keys
      if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
        e.preventDefault();
      }

      if (e.code === 'ArrowLeft' || e.code === 'KeyA') {
        inputRef.current.left = true;
      }
      if (e.code === 'ArrowRight' || e.code === 'KeyD') {
        inputRef.current.right = true;
      }
      if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') {
        if (!inputRef.current.jump) {
          inputRef.current.jumpPressed = true;
        }
        inputRef.current.jump = true;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'ArrowLeft' || e.code === 'KeyA') {
        inputRef.current.left = false;
      }
      if (e.code === 'ArrowRight' || e.code === 'KeyD') {
        inputRef.current.right = false;
      }
      if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') {
        inputRef.current.jump = false;
        inputRef.current.jumpPressed = false;
      }
    };

    const handleBlur = () => {
      inputRef.current = { left: false, right: false, jump: false, jumpPressed: false };
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', handleBlur);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', handleBlur);
    };
  }, []);

  // Main 60fps Game Loop
  useEffect(() => {
    let animId: number;

    const gameLoop = (timestamp: number) => {
      const rawDt = (timestamp - lastTimeRef.current) / 1000;
      lastTimeRef.current = timestamp;
      const dt = Math.min(rawDt, 0.05); // clamp delta time for stability

      const canvas = canvasRef.current;
      if (canvas && room) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          // Adjust canvas size to parent container
          if (
            canvas.width !== canvas.clientWidth ||
            canvas.height !== canvas.clientHeight
          ) {
            canvas.width = canvas.clientWidth;
            canvas.height = canvas.clientHeight;
          }

          const level = getWorldById(room.levelId);
          const players = Object.values(room.players);
          const camera = cameraRef.current;
          const renderer = rendererRef.current;

          // Sound trigger for countdown
          if (room.phase === 'countdown') {
            const sec = Math.ceil(room.countdownTimer);
            if (sec !== countdownPlayedRef.current && sec > 0) {
              countdownPlayedRef.current = sec;
              audio.playCountdownBeep(false);
            }
          } else if (room.phase === 'racing' && countdownPlayedRef.current > 0) {
            countdownPlayedRef.current = 0;
            audio.playCountdownBeep(true);
            audio.playBgm('race');
          }

          // Authoritative host simulation vs client input streaming
          if (network.isHost()) {
            network.updateHost(dt, timestamp / 1000, inputRef.current);
          } else {
            // Non-host sends local input to authoritative host
            network.sendInput(inputRef.current);
            // Non-host also simulates moving hazards locally for silky smooth 60fps animation
            updateMovingHazards(level, dt);
            updateCollapsingPlatforms(level, dt);
          }

          // Camera follow group (or focus target in trap placement phase)
          const isTrapPhase = room.phase === 'trap_placement';
          const activeAnchor = selectedAnchorId
            ? level.trapAnchors.find((a) => a.id === selectedAnchorId)
            : null;
          const focusTarget = activeAnchor
            ? { x: activeAnchor.x + activeAnchor.width / 2, y: activeAnchor.y }
            : null;

          camera.update(
            players,
            level,
            canvas.width,
            canvas.height,
            dt,
            focusTarget,
            isTrapPhase
          );

          // Juicy Combat & Race Event Popups
          for (const p of players) {
            const prev = prevPlayersRef.current[p.id];
            if (prev) {
              if (p.lastCheckpointId > prev.checkpoint && p.lastCheckpointId > 0) {
                renderer.showFloatingText(p.x, p.y - 42, 'CHECKPOINT!', '#38bdf8');
                renderer.spawnParticles(p.x, p.y - 15, 12, '#38bdf8', 'sparkle');
              }
              if (p.finished && !prev.finished) {
                const rankText = p.finishRank === 1 ? '1ST PLACE!' : `${p.finishRank || 1}TH PLACE!`;
                renderer.showFloatingText(p.x, p.y - 48, rankText, '#facc15');
                renderer.spawnParticles(p.x, p.y - 20, 20, '#facc15', 'sparkle');
              }
              if (p.statusEffect === 'slimed' && prev.status !== 'slimed') {
                renderer.showFloatingText(p.x, p.y - 36, 'SLIMED!', '#c084fc');
              }
              if (p.statusEffect === 'bubbled' && prev.status !== 'bubbled') {
                renderer.showFloatingText(p.x, p.y - 36, 'TRAPPED!', '#f472b6');
              }
              if (p.statusEffect === 'dizzy' && prev.status !== 'dizzy') {
                renderer.showFloatingText(p.x, p.y - 36, 'BONKED!', '#fbbf24');
              }
            }
            prevPlayersRef.current[p.id] = {
              checkpoint: p.lastCheckpointId,
              finished: p.finished,
              status: p.statusEffect,
            };
          }

          // Particles
          renderer.updateParticles(dt);

          // Render World + Live Cursor Ghost Preview of the Selected Trap
          const ghostTrap =
            isTrapPhase && cursorWorldRef.current
              ? {
                  x: cursorWorldRef.current.x,
                  y: cursorWorldRef.current.y,
                  type: selectedTrapType,
                }
              : null;

          renderer.render(
            ctx,
            canvas.width,
            canvas.height,
            level,
            players,
            room.traps,
            camera,
            isTrapPhase,
            selectedAnchorId,
            null,
            ghostTrap
          );
        }
      }

      // Reset edge triggers at end of tick
      inputRef.current.jumpPressed = false;

      animId = requestAnimationFrame(gameLoop);
    };

    animId = requestAnimationFrame(gameLoop);
    return () => cancelAnimationFrame(animId);
  }, [room, selectedAnchorId, selectedTrapType]);

  // Track mouse coordinates over canvas for live ghost trap preview
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (room.phase !== 'trap_placement') return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const screenX = e.clientX - rect.left;
    const screenY = e.clientY - rect.top;

    const world = cameraRef.current.screenToWorld(
      screenX,
      screenY,
      canvas.width,
      canvas.height
    );

    const pos = { x: Math.round(world.x), y: Math.round(world.y) };
    cursorWorldRef.current = pos;
    setCursorWorldPos(pos);
  };

  // Click ANYWHERE on canvas to place trap without restriction!
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (room.phase !== 'trap_placement') return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const currentLevel = getWorldById(room.levelId);
    const rect = canvas.getBoundingClientRect();
    const screenX = e.clientX - rect.left;
    const screenY = e.clientY - rect.top;

    const world = cameraRef.current.screenToWorld(
      screenX,
      screenY,
      canvas.width,
      canvas.height
    );

    // Clamp coordinates safely within course limits
    const placeX = Math.max(20, Math.min(currentLevel.width - 60, world.x));
    const placeY = Math.max(30, Math.min(currentLevel.deathY - 20, world.y));

    // Check if clicked near a predefined anchor spot
    const clickedAnchor = currentLevel.trapAnchors.find((a) => {
      return (
        world.x >= a.x - 30 &&
        world.x <= a.x + a.width + 30 &&
        world.y >= a.y - 30 &&
        world.y <= a.y + a.height + 30
      );
    });

    // Place trap directly at clicked spot!
    network.placeTrap(placeX, placeY, selectedTrapType, clickedAnchor?.id);
    audio.playTrapPlace();
    rendererRef.current.spawnParticles(placeX, placeY, 16, '#38bdf8', 'sparkle');
  };

  const handlePlaceTrapAtAnchor = (anchorId: string) => {
    const currentLevel = getWorldById(room.levelId);
    const anchor = currentLevel.trapAnchors.find((a) => a.id === anchorId);
    if (!anchor) return;
    network.placeTrap(anchor.x, anchor.y, selectedTrapType, anchorId);
    audio.playTrapPlace();
    rendererRef.current.spawnParticles(anchor.x, anchor.y, 16, '#38bdf8', 'sparkle');
  };

  const localPlayer = room.players[localPlayerId];
  const sortedByX = Object.values(room.players).sort((a, b) => b.x - a.x);
  const myRank = localPlayer ? sortedByX.findIndex((p) => p.id === localPlayer.id) + 1 : 1;

  return (
    <div className="relative w-full h-screen bg-slate-950 overflow-hidden select-none">
      {/* 60fps Isolated HTML5 Canvas with Freeform Click-to-Place */}
      <canvas
        ref={canvasRef}
        onClick={handleCanvasClick}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => {
          cursorWorldRef.current = null;
          setCursorWorldPos(null);
        }}
        className="w-full h-full block pixelated cursor-crosshair"
      />

      {/* World Transition Intro Overlay */}
      {room.phase === 'world_transition' && (
        <WorldTransitionScreen
          levelId={room.levelId}
          currentRound={room.currentRound}
          totalRounds={room.totalRounds}
          remainingTime={room.worldTransitionTimer ?? 3.5}
          isHost={network.isHost()}
          onProceed={() => network.skipTrapPhase()}
        />
      )}

      {/* Trap Placement UI Overlay */}
      {room.phase === 'trap_placement' && (
        <TrapPlacementOverlay
          levelId={room.levelId}
          remainingTime={room.trapPhaseTimer}
          localPlayerId={localPlayerId}
          traps={room.traps}
          totalPlayers={Object.keys(room.players).length}
          isHost={network.isHost()}
          selectedType={selectedTrapType}
          onSelectType={(type) => setSelectedTrapType(type)}
          onPlaceTrapAtAnchor={handlePlaceTrapAtAnchor}
          onSelectAnchor={(id) => setSelectedAnchorId(id)}
          onSkipTrapPhase={() => network.skipTrapPhase()}
          selectedAnchorId={selectedAnchorId}
          cursorWorldPos={cursorWorldPos}
        />
      )}

      {/* Countdown 3-2-1-GO Overlay */}
      {room.phase === 'countdown' && (
        <div className="pointer-events-none absolute inset-0 z-40 flex items-center justify-center">
          <div className="flex flex-col items-center animate-bounce">
            <span className="font-arcade text-7xl sm:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-b from-yellow-300 via-amber-400 to-rose-500 drop-shadow-[0_8px_20px_rgba(0,0,0,0.9)]">
              {Math.max(1, Math.ceil(room.countdownTimer))}
            </span>
            <span className="font-arcade text-sm sm:text-base text-white uppercase tracking-widest mt-4 bg-gradient-to-r from-rose-600 via-amber-500 to-yellow-400 px-6 py-2.5 rounded-2xl border-3 border-yellow-300 shadow-2xl">
              STAGE {room.currentRound} · READY... GO!
            </span>
          </div>
        </div>
      )}

      {/* Perimeter Game Shell HUD (16-Bit Retro Arcade Layout) */}
      <div className="pointer-events-none absolute inset-0 z-20 flex flex-col justify-between p-3 sm:p-4">
        {/* Top Header Bar with Live Mini-Track Progress */}
        <div className="flex items-center justify-between gap-3">
          {/* Round & Course Badge */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-gradient-to-b from-slate-900/95 via-indigo-950/90 to-slate-950/95 border-3 border-amber-400 shadow-xl backdrop-blur-md">
              <Trophy className="w-4 h-4 text-amber-400" />
              <span className="font-arcade text-[10px] text-amber-300">
                STAGE {room.currentRound}/{room.totalRounds}
              </span>
            </div>

            <div className="hidden lg:flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-gradient-to-b from-slate-900/95 to-slate-950/95 border-2 border-slate-700 shadow-lg text-xs font-poppins font-black text-slate-100">
              <span className="text-base">{getWorldById(room.levelId).badgeIcon}</span>
              <span className="font-arcade text-[10px]">{getWorldById(room.levelId).name}</span>
              <span className="text-[10px] text-amber-400 font-poppins font-black ml-1">
                {'★'.repeat(getWorldById(room.levelId).difficultyStars)}
              </span>
            </div>
          </div>

          {/* Live Mini-Track Progress Bar (Mario Kart / SpeedRunners style) */}
          <div className="pointer-events-auto flex-1 max-w-xl mx-2 hidden sm:block">
            <div className="relative h-8 rounded-full bg-slate-950/95 border-2 border-amber-400/80 shadow-lg px-3 flex items-center">
              {/* Track line */}
              <div className="w-full h-1.5 bg-slate-800 rounded-full relative">
                {/* Checkpoint markers for active world */}
                {getWorldById(room.levelId)
                  .checkpoints.filter((cp) => cp.id > 0)
                  .map((cp) => (
                    <div
                      key={cp.id}
                      className="absolute top-1/2 -translate-y-1/2 w-2 h-3.5 bg-sky-400 rounded-sm shadow-xs"
                      style={{
                        left: `${(cp.x / getWorldById(room.levelId).width) * 100}%`,
                      }}
                      title={`CP ${cp.id}: ${cp.name}`}
                    />
                  ))}
                {/* Finish marker */}
                <div
                  className="absolute top-1/2 -translate-y-1/2 -right-1 w-4 h-4 bg-amber-400 rounded-full flex items-center justify-center font-poppins text-[8px] text-slate-950 font-black shadow"
                  title="Finish"
                >
                  🏁
                </div>

                {/* Player Pins */}
                {Object.values(room.players).map((p) => {
                  const targetFinishX = getWorldById(room.levelId).finishTrigger.x;
                  const progressPct = Math.min(100, Math.max(0, (p.x / targetFinishX) * 100));
                  const isSelf = p.id === localPlayerId;
                  return (
                    <div
                      key={p.id}
                      className={`absolute top-1/2 -translate-y-1/2 -translate-x-1/2 transition-all duration-75 flex flex-col items-center z-10`}
                      style={{ left: `${progressPct}%` }}
                    >
                      <div
                        className={`w-4 h-4 rounded-full border-2 flex items-center justify-center font-poppins text-[8px] font-black shadow-md ${
                          isSelf
                            ? 'bg-amber-400 text-slate-950 border-white ring-2 ring-amber-400 scale-125'
                            : 'bg-rose-500 text-white border-white'
                        }`}
                        title={p.name}
                      >
                        {p.name.charAt(0).toUpperCase()}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Quick Audio Controls */}
          <div className="pointer-events-auto flex items-center gap-2">
            <button
              onClick={() => {
                const muted = audio.toggleMute();
                setIsMuted(muted);
              }}
              className="p-2.5 rounded-2xl bg-gradient-to-b from-slate-800 to-slate-900 hover:from-slate-700 hover:to-slate-800 border-2 border-slate-700 text-slate-200 hover:text-white transition-all shadow-md cursor-pointer"
              title="Toggle Mute"
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-amber-400" />}
            </button>

            <button
              onClick={onOpenAudioSettings}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-gradient-to-b from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 border-2 border-amber-300 text-slate-950 text-xs font-poppins font-black shadow-md active:translate-y-0.5 cursor-pointer"
              title="Audio Settings"
            >
              <span>Sound Menu</span>
            </button>
          </div>
        </div>

        {/* Bottom Status Clusters */}
        <div className="flex items-end justify-between gap-3">
          {/* Racer Placement & Checkpoint Status */}
          {localPlayer && (
            <div className="flex flex-wrap items-center gap-3">
              <div className="px-4 py-2.5 rounded-2xl bg-gradient-to-b from-slate-900/95 via-indigo-950/90 to-slate-950/95 border-3 border-amber-400 shadow-2xl backdrop-blur-md flex items-center gap-3">
                <div className="font-poppins text-2xl sm:text-3xl font-black text-amber-400 tabular-nums">
                  {myRank}
                  <span className="text-xs text-amber-200/90 ml-1">
                    {myRank === 1 ? 'ST 🥇' : myRank === 2 ? 'ND 🥈' : myRank === 3 ? 'RD 🥉' : 'TH'}
                  </span>
                </div>
                <div className="h-6 w-px bg-slate-700" />
                <div>
                  <div className="text-[10px] font-poppins font-black text-slate-400">CHECKPOINT</div>
                  <div className="font-poppins font-black text-xs text-emerald-400">
                    {localPlayer.lastCheckpointId === 0
                      ? 'Start Shelf'
                      : `CP #${localPlayer.lastCheckpointId}`}
                  </div>
                </div>
              </div>

              {/* Status Effect Banner with Cartoon Badges */}
              {localPlayer.statusEffect !== 'none' && (
                <div className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-rose-500/30 border-2 border-rose-400 text-rose-200 font-poppins font-black text-xs shadow-lg animate-pulse backdrop-blur-sm">
                  <ShieldAlert className="w-4 h-4 text-rose-400" />
                  {localPlayer.statusEffect === 'slimed'
                    ? 'GOOEY SLIME! (Slow)'
                    : localPlayer.statusEffect === 'launched'
                    ? 'SPRING LAUNCHED!'
                    : localPlayer.statusEffect === 'dizzy'
                    ? 'CHOMPED & DIZZY!'
                    : localPlayer.statusEffect === 'bubbled'
                    ? 'SOAPY BUBBLE FLOAT!'
                    : localPlayer.statusEffect === 'slipping'
                    ? 'SLICK BANANA SLIP!'
                    : 'HAZARD HIT!'}
                </div>
              )}
            </div>
          )}

          {/* On-screen control reminder */}
          <div className="hidden sm:block text-right text-xs font-poppins font-bold text-amber-200/90 bg-slate-950/85 px-4 py-2 rounded-2xl border-2 border-amber-400/50 shadow">
            A/D: Run · Space/W: Jump · Esc: Sound Menu
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Sparkles, Check, Bomb, ArrowRight, Eye, MousePointerClick } from 'lucide-react';
import { getWorldById } from '../game/worlds';
import { PlacedTrap, TrapType } from '../game/types';
import { TRAP_DEFINITIONS, TrapVisualPreview } from '../game/traps';
import { audio } from '../game/audio';

interface TrapPlacementOverlayProps {
  levelId?: string;
  remainingTime: number;
  localPlayerId: string;
  traps: PlacedTrap[];
  totalPlayers: number;
  isHost: boolean;
  selectedType: TrapType;
  onSelectType: (type: TrapType) => void;
  onPlaceTrapAtAnchor: (anchorId: string) => void;
  onSelectAnchor: (anchorId: string | null) => void;
  onSkipTrapPhase?: () => void;
  selectedAnchorId: string | null;
  cursorWorldPos: { x: number; y: number } | null;
}

export const TrapPlacementOverlay: React.FC<TrapPlacementOverlayProps> = ({
  levelId = 'world_training',
  remainingTime,
  localPlayerId,
  traps,
  totalPlayers,
  isHost,
  selectedType,
  onSelectType,
  onPlaceTrapAtAnchor,
  onSelectAnchor,
  onSkipTrapPhase,
  selectedAnchorId,
  cursorWorldPos,
}) => {
  const hasAlreadyPlaced = traps.some((t) => t.ownerId === localPlayerId);
  const activeLevel = getWorldById(levelId);

  const availableAnchors = activeLevel.trapAnchors.filter(
    (a) => !traps.some((t) => t.anchorId === a.id)
  );

  const handleConfirmAnchorPlacement = () => {
    if (!selectedAnchorId || hasAlreadyPlaced) return;
    audio.playTrapPlace();
    onPlaceTrapAtAnchor(selectedAnchorId);
  };

  const trapList = Object.values(TRAP_DEFINITIONS);

  return (
    <div className="pointer-events-none absolute inset-0 z-30 flex flex-col justify-between p-3 sm:p-5">
      {/* Top Banner: Countdown, Status & Placement Instructions */}
      <div className="pointer-events-auto mx-auto w-full max-w-4xl rounded-3xl border-3 border-amber-400/90 bg-gradient-to-r from-slate-900/95 via-indigo-950/95 to-slate-900/95 p-3.5 sm:p-4 shadow-[0_12px_30px_rgba(0,0,0,0.6)] backdrop-blur-md">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 text-slate-950 shadow-md shadow-amber-500/30 border-b-3 border-amber-600">
              <Bomb className="w-6 h-6 animate-bounce" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-toy text-xl sm:text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-300 to-yellow-400 leading-tight">
                  Secret Trap Phase
                </h2>
                <span className="text-[11px] font-poppins font-black px-2.5 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/40">
                  {traps.length}/{totalPlayers} PLACED
                </span>
              </div>
              <p className="text-xs text-amber-200/90 font-poppins font-medium mt-0.5 flex items-center gap-1.5">
                <MousePointerClick className="w-4 h-4 text-cyan-400 animate-pulse" />
                <span>
                  <strong className="text-white">Click ANYWHERE on the course</strong> to drop your secret trap!
                </span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="font-poppins font-black text-2xl sm:text-3xl text-amber-300 tabular-nums drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)]">
                {Math.max(0, Math.ceil(remainingTime))}s
              </div>
              <span className="text-[10px] font-poppins font-bold tracking-wider text-amber-200/70 uppercase">
                Prep Time
              </span>
            </div>

            {isHost && (
              <button
                onClick={() => {
                  audio.playButtonClick();
                  if (onSkipTrapPhase) onSkipTrapPhase();
                }}
                className="hidden sm:flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-gradient-to-b from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-poppins font-black text-xs shadow-md border-b-4 border-amber-600 active:border-b-0 active:translate-y-1 transition-all cursor-pointer"
                title="Start the race immediately"
              >
                <span>Start Race</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Progress Bar (25s total) */}
        <div className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-slate-950/80 p-0.5 border border-slate-700/50">
          <div
            className="h-full rounded-full bg-gradient-to-r from-cyan-400 via-amber-400 to-rose-500 transition-all duration-200 shadow-[0_0_10px_rgba(251,191,36,0.6)]"
            style={{ width: `${Math.max(0, (remainingTime / 25) * 100)}%` }}
          />
        </div>
      </div>

      {/* Bottom Control Dock: Trap Visual Selector & Anchor Quick Spots */}
      <div className="pointer-events-auto mx-auto w-full max-w-5xl rounded-2xl border-2 border-slate-700 bg-slate-900/95 p-4 sm:p-5 shadow-2xl backdrop-blur-md">
        {hasAlreadyPlaced ? (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-2">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                <Check className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-toy text-lg sm:text-xl font-bold text-emerald-400">
                  Secret Trap Locked In!
                </h3>
                <p className="text-xs text-slate-300">
                  Your trap is primed on the map. Opponents cannot see it until the countdown ends!
                  <span className="text-amber-300 ml-1">
                    (Click anywhere on the map to relocate it anytime before the race starts)
                  </span>
                </p>
              </div>
            </div>

            {isHost && (
              <button
                onClick={() => {
                  audio.playButtonClick();
                  if (onSkipTrapPhase) onSkipTrapPhase();
                }}
                className="px-6 py-3 rounded-2xl bg-gradient-to-b from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-poppins font-black text-sm shadow-lg border-b-4 border-amber-600 active:border-b-0 active:translate-y-1 transition-all flex items-center gap-2 cursor-pointer"
              >
                Start Race Now ({Math.max(0, Math.ceil(remainingTime))}s left)
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            {/* Left Column: Trap Type Selection with Full Pixel-Art Previews */}
            <div className="md:col-span-7 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-poppins font-black text-slate-300 uppercase tracking-wide">
                  1. Choose Trap Visual & Ability
                </span>
                <span className="text-xs text-amber-300 font-poppins font-black px-2 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/30">
                  {TRAP_DEFINITIONS[selectedType].tag}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2.5">
                {trapList.map((trap) => {
                  const isSelected = selectedType === trap.type;
                  return (
                    <button
                      key={trap.type}
                      onClick={() => {
                        audio.playButtonClick();
                        onSelectType(trap.type);
                      }}
                      className={`p-2.5 rounded-2xl border-2 text-left transition-all cursor-pointer flex flex-col items-center justify-between ${
                        isSelected
                          ? `${trap.cardBorder} ring-3 ring-amber-400/50 shadow-xl scale-[1.03] bg-indigo-950/60`
                          : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:border-slate-700 hover:bg-slate-800/80 hover:scale-[1.01]'
                      }`}
                    >
                      {/* Pixel-Art Preview Canvas */}
                      <TrapVisualPreview type={trap.type} width={88} height={48} />

                      <div className="w-full mt-2 text-center">
                        <span className="font-toy font-black text-xs block text-slate-100 truncate">
                          {trap.name}
                        </span>
                        <span className="text-[10px] font-poppins font-bold block text-amber-300/80 mt-0.5 uppercase tracking-wide">
                          {trap.tag}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Selected Trap Description */}
              <div className="p-2.5 rounded-2xl bg-slate-950/90 border border-slate-800 text-xs shadow-inner">
                <span className="font-poppins font-black text-amber-300">
                  {TRAP_DEFINITIONS[selectedType].name}:{' '}
                </span>
                <span className="text-slate-300 font-poppins font-medium">
                  {TRAP_DEFINITIONS[selectedType].description}
                </span>
              </div>
            </div>

            {/* Right Column: Click Anywhere Prompt & Suggested Spots */}
            <div className="md:col-span-5 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-poppins font-black text-slate-300 uppercase tracking-wide">
                    2. Drop Location
                  </span>
                  <button
                    onClick={() => onSelectAnchor(null)}
                    className="text-[11px] font-poppins font-bold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    Overview
                  </button>
                </div>

                <div className="mt-2 p-3 rounded-2xl bg-slate-950/90 border border-cyan-500/40 text-xs text-cyan-200 space-y-1 shadow-md">
                  <div className="font-poppins font-black flex items-center gap-1.5 text-cyan-300">
                    <MousePointerClick className="w-4 h-4 text-cyan-400" />
                    Freeform Placement Active
                  </div>
                  <p className="text-[11px] text-slate-300 font-poppins leading-relaxed">
                    Hover anywhere on the map to see the ghost preview, then <strong className="text-cyan-300">click</strong> to place!
                  </p>
                  {cursorWorldPos && (
                    <div className="text-[11px] font-poppins font-black text-amber-300 mt-1">
                      Target: X: {cursorWorldPos.x}, Y: {cursorWorldPos.y}
                    </div>
                  )}
                </div>

                {/* Suggested Shortcut Spots */}
                <div className="mt-2.5">
                  <span className="text-[10px] font-poppins font-bold text-slate-400 uppercase tracking-wider">
                    Or Click a Suggested Location:
                  </span>
                  <div className="grid grid-cols-2 gap-1.5 mt-1.5 max-h-24 overflow-y-auto pr-1">
                    {availableAnchors.slice(0, 4).map((anchor) => (
                      <button
                        key={anchor.id}
                        onClick={() => {
                          audio.playButtonClick();
                          onSelectAnchor(anchor.id);
                        }}
                        className={`text-left p-1.5 rounded-xl border text-[11px] font-poppins font-semibold truncate transition-all cursor-pointer ${
                          selectedAnchorId === anchor.id
                            ? 'border-amber-400 bg-amber-500/20 text-amber-300 shadow-sm'
                            : 'border-slate-800 bg-slate-800/40 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                        }`}
                      >
                        {anchor.zone.split(':')[1]?.trim() || anchor.zone}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Confirm Selected Anchor CTA if user picked one */}
              {selectedAnchorId && (
                <div className="mt-2 pt-2 border-t border-slate-800 flex justify-end">
                  <button
                    onClick={handleConfirmAnchorPlacement}
                    className="px-5 py-2.5 rounded-2xl bg-gradient-to-b from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-poppins font-black text-xs shadow-md border-b-4 border-amber-600 active:border-b-0 active:translate-y-1 transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    Drop at Selected Spot
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

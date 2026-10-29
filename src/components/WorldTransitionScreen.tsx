/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { Star, ShieldAlert, Compass, Sparkles, ChevronRight } from 'lucide-react';
import { getWorldById } from '../game/worlds';

interface WorldTransitionScreenProps {
  levelId: string;
  currentRound: number;
  totalRounds: number;
  remainingTime?: number;
  isHost?: boolean;
  onProceed?: () => void;
}

export const WorldTransitionScreen: React.FC<WorldTransitionScreenProps> = ({
  levelId,
  currentRound,
  totalRounds,
  remainingTime = 3.5,
  isHost = false,
  onProceed,
}) => {
  const world = getWorldById(levelId);
  const [countdown, setCountdown] = useState(Math.ceil(remainingTime));

  useEffect(() => {
    setCountdown(Math.max(1, Math.ceil(remainingTime)));
  }, [remainingTime]);

  // Color mapping based on theme
  const getThemeGradient = () => {
    switch (world.theme) {
      case 'arcade_neon':
      case 'industrial':
        return 'from-purple-600/40 via-indigo-950/80 to-slate-950';
      case 'jungle':
        return 'from-emerald-600/40 via-teal-950/80 to-slate-950';
      case 'candy':
        return 'from-pink-600/40 via-fuchsia-950/80 to-slate-950';
      case 'frozen':
        return 'from-sky-600/40 via-blue-950/80 to-slate-950';
      case 'lava':
        return 'from-rose-600/40 via-red-950/80 to-slate-950';
      case 'cosmic':
      case 'cyber':
        return 'from-indigo-600/40 via-slate-950 to-slate-950';
      case 'playground':
      default:
        return 'from-emerald-500/40 via-sky-950/80 to-slate-950';
    }
  };

  const getBorderColor = () => {
    switch (world.theme) {
      case 'arcade_neon':
      case 'industrial':
        return 'border-cyan-400';
      case 'jungle':
        return 'border-emerald-400';
      case 'candy':
        return 'border-pink-400';
      case 'frozen':
        return 'border-sky-400';
      case 'lava':
        return 'border-rose-500';
      case 'cosmic':
      case 'cyber':
        return 'border-cyan-400';
      case 'playground':
      default:
        return 'border-amber-400';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 backdrop-blur-md p-4 animate-in fade-in zoom-in-95 duration-200 select-none">
      {/* Dynamic ambient theme background glow */}
      <div
        className={`w-full max-w-2xl rounded-3xl border-4 ${getBorderColor()} bg-gradient-to-b ${getThemeGradient()} p-6 sm:p-8 shadow-2xl relative overflow-hidden`}
      >
        {/* Subtle animated background grid / particles */}
        <div className="absolute inset-0 opacity-15 pointer-events-none bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]" />

        {/* Top Header Badge */}
        <div className="relative z-10 flex items-center justify-between gap-3 mb-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-900/95 border-2 border-slate-700 shadow-md">
            <Compass className="w-4 h-4 text-amber-400 animate-spin [animation-duration:8s]" />
            <span className="font-arcade text-[10px] text-amber-300 tracking-wider">
              STAGE {currentRound} / {totalRounds} · READY!
            </span>
          </div>

          {/* Difficulty Rating Stars */}
          <div className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-slate-900/95 border-2 border-slate-700">
            <span className="text-xs font-arcade text-[9px] text-slate-300 mr-1 hidden sm:inline">
              DIFFICULTY:
            </span>
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                className={`w-4 h-4 ${
                  i < world.difficultyStars
                    ? 'text-amber-400 fill-amber-400 filter drop-shadow-[0_0_4px_rgba(251,191,36,0.8)]'
                    : 'text-slate-600'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Center Title & Badge */}
        <div className="relative z-10 flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6 my-4">
          {/* Big Cartoon World Badge Icon */}
          <div
            className={`w-20 h-20 sm:w-24 sm:h-24 rounded-3xl border-3 ${getBorderColor()} bg-slate-900/95 flex items-center justify-center text-4xl sm:text-5xl shadow-2xl shrink-0 transform -rotate-3 hover:rotate-0 transition-transform`}
          >
            {world.badgeIcon}
          </div>

          {/* World Titles */}
          <div className="text-center sm:text-left flex-1">
            <div className="text-xs font-arcade text-[9px] text-sky-400 uppercase tracking-widest mb-1 flex items-center justify-center sm:justify-start gap-1">
              <Sparkles className="w-3.5 h-3.5" />
              <span>STAGE 0{world.worldNumber}</span>
            </div>
            <h1 className="font-arcade text-2xl sm:text-3xl text-white tracking-wide drop-shadow-[0_4px_12px_rgba(0,0,0,0.8)]">
              {world.name}
            </h1>
            <p className="font-poppins font-bold text-sm text-amber-300/95 mt-1">
              {world.subtitle}
            </p>
          </div>
        </div>

        {/* Tactical Intel Cards */}
        <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 gap-3 my-5">
          {/* Environment Brief */}
          <div className="p-4 rounded-2xl bg-slate-900/90 border-2 border-slate-800 shadow-lg">
            <div className="text-xs font-poppins font-black text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <span>🗺️ Terrain Report</span>
            </div>
            <p className="text-xs text-slate-200 leading-relaxed font-poppins font-medium">
              {world.description}
            </p>
          </div>

          {/* Active Hazards */}
          <div className="p-4 rounded-2xl bg-slate-900/90 border-2 border-slate-800 shadow-lg">
            <div className="text-xs font-poppins font-black text-rose-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 text-rose-400" />
              <span>Level Hazards</span>
            </div>
            <p className="text-xs text-slate-200 leading-relaxed font-poppins font-medium">
              {world.hazardsDescription}
            </p>
          </div>
        </div>

        {/* Bottom Countdown & Action */}
        <div className="relative z-10 flex items-center justify-between gap-4 pt-3 border-t border-slate-800/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-yellow-400 text-slate-950 font-poppins font-black text-lg flex items-center justify-center shadow-lg animate-pulse border-2 border-amber-300">
              {countdown}
            </div>
            <span className="font-poppins text-xs font-bold text-amber-200">
              Trap Placement Starts Soon...
            </span>
          </div>

          {isHost && onProceed && (
            <button
              onClick={onProceed}
              className="flex items-center gap-1.5 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-amber-400 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 text-slate-950 font-poppins text-xs font-black shadow-lg border-2 border-amber-300 border-b-3 border-b-amber-700 active:border-b-0 active:translate-y-0.5 transition-all cursor-pointer"
            >
              <span>SKIP</span>
              <ChevronRight className="w-4 h-4 stroke-[3]" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

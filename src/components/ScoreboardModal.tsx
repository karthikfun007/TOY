/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Trophy, Medal, RotateCcw, ArrowRight, Star } from 'lucide-react';
import { getCharacterInfo } from '../game/characters';
import { PlayerState } from '../game/types';
import { audio } from '../game/audio';
import { getWorldForRound } from '../game/worlds';

interface ScoreboardModalProps {
  isMatchOver: boolean;
  currentRound: number;
  totalRounds: number;
  players: Record<string, PlayerState>;
  isHost: boolean;
  onNextRound: () => void;
  onRematch: () => void;
}

export const ScoreboardModal: React.FC<ScoreboardModalProps> = ({
  isMatchOver,
  currentRound,
  totalRounds,
  players,
  isHost,
  onNextRound,
  onRematch,
}) => {
  const nextWorld = getWorldForRound(currentRound + 1);
  const sortedPlayers = Object.values(players).sort((a, b) => {
    if (isMatchOver) {
      return b.totalScore - a.totalScore;
    }
    // For single round results, sort by round finish rank or score
    const rankA = a.finishRank ?? 99;
    const rankB = b.finishRank ?? 99;
    return rankA - rankB;
  });

  useEffect(() => {
    audio.playBgm('victory');
    // Confetti celebration
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });
    } catch {
      // ignore
    }
  }, [isMatchOver]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-2xl max-h-[92vh] overflow-y-auto rounded-3xl border-4 border-amber-400 bg-gradient-to-b from-slate-900 via-indigo-950 to-slate-950 p-5 sm:p-7 shadow-2xl text-slate-100 animate-in fade-in zoom-in duration-300">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/40 text-xs font-arcade mb-2">
            <Trophy className="w-4 h-4 text-amber-400" />
            {isMatchOver ? 'MATCH COMPLETE · TOYBOX CHAMPION' : `STAGE ${currentRound} / ${totalRounds} RESULTS`}
          </div>
          <h2 className="font-arcade text-xl sm:text-2xl text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-500 drop-shadow-[0_4px_12px_rgba(0,0,0,0.8)]">
            {isMatchOver ? '★ ARCADE GRAND CHAMPION! ★' : 'STAGE COMPLETE!'}
          </h2>
        </div>

        {/* Podium for Top 3 */}
        <div className="grid grid-cols-3 gap-3 mb-6 items-end">
          {/* 2nd Place */}
          {sortedPlayers[1] && (
            <div className="flex flex-col items-center bg-slate-800/90 rounded-2xl p-3 border-2 border-slate-700 shadow-md">
              <span className="font-poppins font-black text-xs text-slate-300 mb-1">2ND PLACE</span>
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center font-toy font-black text-xl mb-1 shadow-md border border-white/20"
                style={{ backgroundColor: getCharacterInfo(sortedPlayers[1].characterId).primaryColor }}
              >
                {sortedPlayers[1].name.slice(0, 2).toUpperCase()}
              </div>
              <span className="font-poppins font-black text-xs truncate max-w-[90px]">{sortedPlayers[1].name}</span>
              <span className="font-poppins font-black text-xs text-amber-300 mt-1">
                {isMatchOver ? `${sortedPlayers[1].totalScore} pts` : `+${sortedPlayers[1].roundPoints[currentRound - 1] || 0} pts`}
              </span>
            </div>
          )}

          {/* 1st Place */}
          {sortedPlayers[0] && (
            <div className="flex flex-col items-center bg-amber-500/20 rounded-3xl p-4 border-3 border-amber-400 -translate-y-2 shadow-2xl">
              <div className="flex items-center gap-1 font-poppins font-black text-xs text-amber-300 mb-1">
                <Medal className="w-4 h-4 text-amber-400" /> 1ST PLACE
              </div>
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center font-toy font-black text-2xl mb-1 shadow-xl border-3 border-amber-300"
                style={{ backgroundColor: getCharacterInfo(sortedPlayers[0].characterId).primaryColor }}
              >
                {sortedPlayers[0].name.slice(0, 2).toUpperCase()}
              </div>
              <span className="font-poppins font-black text-sm truncate max-w-[120px] text-amber-200">
                {sortedPlayers[0].name}
              </span>
              <span className="font-poppins font-black text-sm text-yellow-300 mt-1">
                {isMatchOver ? `${sortedPlayers[0].totalScore} pts` : `+${sortedPlayers[0].roundPoints[currentRound - 1] || 0} pts`}
              </span>
            </div>
          )}

          {/* 3rd Place */}
          {sortedPlayers[2] && (
            <div className="flex flex-col items-center bg-slate-800/90 rounded-2xl p-3 border-2 border-slate-700 shadow-md">
              <span className="font-poppins font-black text-xs text-amber-400/90 mb-1">3RD PLACE</span>
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center font-toy font-black text-xl mb-1 shadow-md border border-white/20"
                style={{ backgroundColor: getCharacterInfo(sortedPlayers[2].characterId).primaryColor }}
              >
                {sortedPlayers[2].name.slice(0, 2).toUpperCase()}
              </div>
              <span className="font-poppins font-black text-xs truncate max-w-[90px]">{sortedPlayers[2].name}</span>
              <span className="font-poppins font-black text-xs text-amber-300 mt-1">
                {isMatchOver ? `${sortedPlayers[2].totalScore} pts` : `+${sortedPlayers[2].roundPoints[currentRound - 1] || 0} pts`}
              </span>
            </div>
          )}
        </div>

        {/* Full Table */}
        <div className="bg-slate-950/80 rounded-2xl border-2 border-slate-800 overflow-hidden mb-6">
          <div className="grid grid-cols-12 px-4 py-2.5 text-xs font-poppins font-black text-slate-400 border-b border-slate-800">
            <span className="col-span-1">#</span>
            <span className="col-span-6">RACER</span>
            <span className="col-span-2 text-center">THIS RD</span>
            <span className="col-span-3 text-right">TOTAL</span>
          </div>

          <div className="divide-y divide-slate-800/60 max-h-48 overflow-y-auto">
            {sortedPlayers.map((p, idx) => {
              const char = getCharacterInfo(p.characterId);
              const roundGain = p.roundPoints[currentRound - 1] || 0;
              return (
                <div
                  key={p.id}
                  className="grid grid-cols-12 items-center px-4 py-2.5 text-xs font-poppins font-bold hover:bg-slate-800/50"
                >
                  <span className="col-span-1 font-poppins font-black text-xs text-slate-400">{idx + 1}</span>
                  <div className="col-span-6 flex items-center gap-2 truncate">
                    <div
                      className="w-5 h-5 rounded-md flex-shrink-0"
                      style={{ backgroundColor: char.primaryColor }}
                    />
                    <span className="truncate font-black">{p.name}</span>
                    {p.isBot && (
                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-purple-500/30 text-purple-300 font-poppins font-black">
                        BOT
                      </span>
                    )}
                  </div>
                  <span className="col-span-2 text-center font-poppins font-black text-xs text-emerald-400">
                    +{roundGain}
                  </span>
                  <span className="col-span-3 text-right font-poppins font-black text-xs text-amber-400">
                    {p.totalScore} pts
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Bottom CTA Actions */}
        <div className="flex items-center justify-between gap-4">
          <div className="text-xs font-poppins font-semibold text-slate-300">
            {isHost ? '👑 Host controls next action' : '⏳ Waiting for host to proceed...'}
          </div>

          {isHost && (
            <div>
              {isMatchOver ? (
                <button
                  onClick={() => {
                    audio.playButtonClick();
                    onRematch();
                  }}
                  className="flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-amber-400 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 text-slate-950 font-poppins font-black text-base shadow-xl border-2 border-amber-300 border-b-4 border-b-amber-700 active:border-b-0 active:translate-y-1 transition-all cursor-pointer"
                >
                  <RotateCcw className="w-5 h-5 stroke-[2.5]" />
                  <span>PLAY REMATCH</span>
                </button>
              ) : (
                <button
                  onClick={() => {
                    audio.playButtonClick();
                    onNextRound();
                  }}
                  className="flex items-center gap-2.5 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-400 via-teal-400 to-emerald-500 hover:from-emerald-300 hover:to-teal-300 text-slate-950 font-poppins font-black text-base shadow-xl border-2 border-emerald-300 border-b-4 border-b-emerald-700 active:border-b-0 active:translate-y-1 transition-all cursor-pointer"
                >
                  <span className="text-xl">{nextWorld.badgeIcon}</span>
                  <span>NEXT: {nextWorld.name.toUpperCase()} (RD {currentRound + 1})</span>
                  <ArrowRight className="w-5 h-5 stroke-[2.5] ml-1" />
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

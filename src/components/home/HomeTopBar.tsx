/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Volume2, Trophy, Pencil, Check } from 'lucide-react';
import { CharacterVisualPreview, getCharacterInfo } from '../../game/characters';
import { CharacterId } from '../../game/types';
import { audio } from '../../game/audio';

interface HomeTopBarProps {
  playerName: string;
  selectedChar: CharacterId;
  onUpdateName: (name: string) => void;
  onOpenAudioSettings: () => void;
}

export const HomeTopBar: React.FC<HomeTopBarProps> = ({
  playerName,
  selectedChar,
  onUpdateName,
  onOpenAudioSettings,
}) => {
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState(playerName);
  const activeChar = getCharacterInfo(selectedChar);

  const handleSaveName = () => {
    const trimmed = tempName.trim();
    if (trimmed) {
      onUpdateName(trimmed);
    }
    setIsEditingName(false);
    audio.playButtonClick();
  };

  return (
    <header className="relative z-20 flex flex-wrap items-center justify-between gap-3 max-w-7xl mx-auto w-full pt-1 pb-2 sm:pb-3 px-2">
      {/* Left: Player Profile Badge */}
      <div className="flex items-center gap-2.5 p-2 pr-4 rounded-2xl bg-gradient-to-b from-slate-900/95 via-indigo-950/90 to-slate-950/95 border-3 border-amber-400 shadow-xl backdrop-blur-md">
        {/* Character Avatar */}
        <div
          className="relative flex h-12 w-12 items-center justify-center rounded-xl border-2 border-amber-400 shadow-inner overflow-hidden shrink-0"
          style={{ backgroundColor: activeChar.secondaryColor }}
        >
          <CharacterVisualPreview
            charId={selectedChar}
            scale={1.1}
            animated={false}
            width={44}
            height={44}
          />
          <div className="absolute bottom-0 inset-x-0 h-1 bg-amber-400" />
        </div>

        {/* Player Name & Stats */}
        <div className="min-w-0">
          {isEditingName ? (
            <div className="flex items-center gap-1">
              <input
                type="text"
                maxLength={16}
                value={tempName}
                autoFocus
                onChange={(e) => setTempName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSaveName();
                  if (e.key === 'Escape') setIsEditingName(false);
                }}
                className="w-28 sm:w-36 px-2.5 py-1 rounded-xl bg-slate-950 border-2 border-amber-400 text-white font-poppins font-bold text-xs sm:text-sm focus:outline-none"
              />
              <button
                onClick={handleSaveName}
                className="p-1.5 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-slate-950 cursor-pointer shadow-sm"
                title="Save Name"
              >
                <Check className="w-4 h-4 stroke-[3]" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-1.5">
              <span className="font-poppins text-sm sm:text-base font-black text-amber-300 truncate max-w-[130px] sm:max-w-[170px] drop-shadow">
                {playerName}
              </span>
              <button
                onClick={() => {
                  setTempName(playerName);
                  setIsEditingName(true);
                  audio.playButtonClick();
                }}
                className="p-1 rounded-md text-slate-400 hover:text-amber-300 transition-colors cursor-pointer"
                title="Change Name"
              >
                <Pencil className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          <div className="flex items-center gap-1.5 text-[11px] font-poppins text-amber-200/90 font-semibold">
            <Trophy className="w-3.5 h-3.5 text-yellow-400" />
            <span>5-Round Racer · Rank 1</span>
          </div>
        </div>
      </div>

      {/* Center: Vibrant Arcade Marquee Title */}
      <div className="flex flex-col items-center justify-center text-center order-first lg:order-none w-full lg:w-auto my-1 lg:my-0">
        <div className="relative inline-block">
          {/* Arcade Marquee Title */}
          <h1 className="font-arcade text-2xl sm:text-3xl lg:text-4xl tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-yellow-300 via-amber-400 to-rose-500 drop-shadow-[0_4px_12px_rgba(0,0,0,0.9)] filter select-none">
            TOYBOX TROUBLE
          </h1>
          <div className="absolute -top-1 -right-3 px-1.5 py-0.5 rounded bg-rose-600 text-[8px] font-arcade text-white tracking-widest animate-pulse border border-yellow-300">
            PARTY
          </div>
        </div>
        <div className="flex items-center gap-2 mt-1">
          <span className="font-arcade text-[9px] px-2 py-0.5 rounded bg-indigo-950 text-cyan-300 font-bold tracking-widest border border-cyan-500/50 shadow-sm">
            ARCADE EDITION
          </span>
          <span className="text-[11px] font-poppins font-black text-amber-300">
            7 Worlds · 2–6 Players · High-Octane Racing
          </span>
          <span className="hidden sm:inline font-arcade text-[8px] px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-500/40">
            ONLINE LIVE
          </span>
        </div>
      </div>

      {/* Right: Audio Settings Button */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => {
            audio.playButtonClick();
            onOpenAudioSettings();
          }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-gradient-to-b from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 text-xs font-poppins font-black transition-all border-2 border-amber-300 border-b-4 border-b-amber-700 active:border-b-0 active:translate-y-0.5 cursor-pointer shadow-lg arcade-btn-push"
          title="Audio & Sound Settings"
        >
          <Volume2 className="w-4 h-4 text-slate-950 stroke-[2.5]" />
          <span className="inline font-arcade text-[10px]">SOUND FX</span>
        </button>
      </div>
    </header>
  );
};

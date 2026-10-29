/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Sparkles, Check } from 'lucide-react';
import { CHARACTERS, CharacterVisualPreview } from '../../game/characters';
import { CharacterId } from '../../game/types';
import { audio } from '../../game/audio';

interface CharacterRosterSelectorProps {
  selectedChar: CharacterId;
  onSelectCharacter: (charId: CharacterId) => void;
}

export const CharacterRosterSelector: React.FC<CharacterRosterSelectorProps> = ({
  selectedChar,
  onSelectCharacter,
}) => {
  return (
    <div className="w-full bg-gradient-to-b from-slate-900/95 via-indigo-950/90 to-slate-950/95 border-3 border-amber-400/80 rounded-3xl p-3.5 sm:p-4 shadow-xl backdrop-blur-md space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span className="font-poppins text-xs font-black text-amber-300 uppercase tracking-wider">
            Toybox Roster
          </span>
          <span className="text-[10px] font-poppins font-black px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/40">
            6 RACERS
          </span>
        </div>
        <span className="text-xs text-slate-300 font-poppins font-semibold hidden sm:inline">
          Click any toy to customize
        </span>
      </div>

      {/* Grid of 6 Characters */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 sm:gap-2.5">
        {CHARACTERS.map((char) => {
          const isSelected = selectedChar === char.id;
          return (
            <button
              key={char.id}
              onClick={() => {
                audio.playButtonClick();
                onSelectCharacter(char.id);
              }}
              className={`relative p-2 rounded-2xl border-2 text-center transition-all cursor-pointer flex flex-col items-center justify-between group ${
                isSelected
                  ? 'border-amber-400 bg-amber-500/25 shadow-lg shadow-amber-500/30 ring-3 ring-amber-400/60 scale-[1.04] border-b-4 border-b-amber-600'
                  : 'border-slate-800 bg-slate-950/80 hover:border-amber-400/60 hover:bg-slate-900/90 border-b-4 border-b-slate-950 hover:-translate-y-0.5 active:translate-y-0.5'
              }`}
            >
              {isSelected && (
                <div className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-amber-400 text-slate-950 font-black shadow-md z-10 animate-pulse">
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                </div>
              )}

              {/* Animated Mini Sprite */}
              <div className="py-1">
                <CharacterVisualPreview
                  charId={char.id}
                  scale={1.3}
                  animated={true}
                  width={54}
                  height={48}
                />
              </div>

              <div className="w-full mt-1 border-t border-white/10 pt-1">
                <h4 className="font-poppins font-black text-xs text-white leading-tight truncate">
                  {char.name}
                </h4>
                <p className="text-[10px] font-poppins text-amber-300/90 leading-snug truncate mt-0.5 font-bold">
                  {char.title.split(' ')[0]}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

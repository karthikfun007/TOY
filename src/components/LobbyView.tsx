/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { CharacterId, RoomState } from '../game/types';
import { HomeWorldBackground } from './home/HomeWorldBackground';
import { HomeTopBar } from './home/HomeTopBar';
import { HeroCharacterStage } from './home/HeroCharacterStage';
import { CharacterRosterSelector } from './home/CharacterRosterSelector';
import { HomeActionHub } from './home/HomeActionHub';

interface LobbyViewProps {
  room: RoomState | null;
  localPlayerId: string;
  playerName: string;
  selectedChar: CharacterId;
  initialJoinCode?: string;
  onUpdateName: (name: string) => void;
  onSelectCharacter: (charId: CharacterId) => void;
  onCreateRoom: () => void;
  onJoinRoom: (code: string) => void;
  onToggleReady: () => void;
  onStartMatch: () => void;
  onAddBot: () => void;
  onOpenAudioSettings: () => void;
}

export const LobbyView: React.FC<LobbyViewProps> = ({
  room,
  localPlayerId,
  playerName,
  selectedChar,
  initialJoinCode,
  onUpdateName,
  onSelectCharacter,
  onCreateRoom,
  onJoinRoom,
  onToggleReady,
  onStartMatch,
  onAddBot,
  onOpenAudioSettings,
}) => {
  return (
    <div className="relative min-h-screen w-full flex flex-col justify-between p-2 sm:p-4 text-slate-100 overflow-y-auto selection:bg-amber-400 selection:text-slate-950 pb-12 sm:pb-8">
      {/* 1. Live Animated Background Environment */}
      <HomeWorldBackground />

      {/* 2. Top Player Profile & 3D Title Bar */}
      <HomeTopBar
        playerName={playerName}
        selectedChar={selectedChar}
        onUpdateName={onUpdateName}
        onOpenAudioSettings={onOpenAudioSettings}
      />

      {/* 3. Main Live Stage & Action Hub (Landscape-first composition) */}
      <main className="relative z-10 max-w-7xl mx-auto w-full my-auto py-2 grid grid-cols-1 lg:grid-cols-12 gap-5 items-center">
        {/* Left / Center Area: Superstar Character Stage & Roster Selector */}
        <div className="lg:col-span-7 flex flex-col items-center justify-center space-y-4">
          {/* Animated 3D Pedestal Stage */}
          <HeroCharacterStage
            selectedChar={selectedChar}
            onSelectCharacter={onSelectCharacter}
          />

          {/* 6-Character Interactive Roster */}
          <div className="w-full max-w-md">
            <CharacterRosterSelector
              selectedChar={selectedChar}
              onSelectCharacter={onSelectCharacter}
            />
          </div>
        </div>

        {/* Right Area: Game Mode, Room Controls & Giant 3D PLAY Button */}
        <div className="lg:col-span-5 flex flex-col justify-center space-y-4 max-w-md mx-auto w-full">
          <HomeActionHub
            room={room}
            localPlayerId={localPlayerId}
            onCreateRoom={onCreateRoom}
            onJoinRoom={onJoinRoom}
            onToggleReady={onToggleReady}
            onStartMatch={onStartMatch}
            onAddBot={onAddBot}
            initialJoinCode={initialJoinCode}
          />
        </div>
      </main>

      {/* 4. Sleek Footer Controls Bar */}
      <footer className="relative z-10 max-w-7xl mx-auto w-full text-center py-1 text-xs text-slate-400 flex flex-wrap items-center justify-center gap-2 sm:gap-3">
        <span>Controls: <strong className="text-amber-300">A / D or Arrow Keys</strong> to run</span>
        <span>·</span>
        <span><strong className="text-amber-300">Space / W / Up</strong> to jump</span>
        <span>·</span>
        <span><strong className="text-amber-300">Esc</strong> for sound settings</span>
      </footer>
    </div>
  );
};

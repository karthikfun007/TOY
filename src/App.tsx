/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { audio } from './game/audio';
import { CharacterId, RoomState } from './game/types';
import { network } from './game/network';
import { LobbyView } from './components/LobbyView';
import { GameCanvas } from './components/GameCanvas';
import { ScoreboardModal } from './components/ScoreboardModal';
import { AudioSettingsModal } from './components/AudioSettingsModal';

export default function App() {
  const [room, setRoom] = useState<RoomState | null>(null);
  const [playerName, setPlayerName] = useState('SpeedyToy');
  const [selectedChar, setSelectedChar] = useState<CharacterId>('dog');

  const [showAudioSettings, setShowAudioSettings] = useState(false);

  // Check URL query parameters for direct invite link (e.g. ?room=TOY-123)
  const [inviteCode] = useState(() => {
    return new URLSearchParams(window.location.search).get('room') || '';
  });

  // Subscribe to network room updates
  useEffect(() => {
    const unsubscribe = network.subscribe((updatedRoom) => {
      setRoom({ ...updatedRoom });
    });
    return unsubscribe;
  }, []);

  // Lobby BGM when on lobby screen
  useEffect(() => {
    if (!room || room.phase === 'lobby') {
      audio.playBgm('lobby');
    }
  }, [room?.phase]);

  const handleUpdateName = (name: string) => {
    setPlayerName(name);
  };

  const handleSelectCharacter = (charId: CharacterId) => {
    setSelectedChar(charId);
    if (room) {
      network.changeCharacter(charId);
    }
  };

  const handleCreateRoom = () => {
    audio.init();
    network.createRoom(playerName, selectedChar);
  };

  const handleJoinRoom = (code: string) => {
    audio.init();
    network.joinRoom(code, playerName, selectedChar);
  };

  const handleToggleReady = () => {
    network.toggleReady();
  };

  const handleStartMatch = () => {
    network.startMatch();
  };

  const handleAddBot = () => {
    network.addBot();
  };

  const handleNextRound = () => {
    network.nextRound();
  };

  const handleRematch = () => {
    network.rematch();
  };

  // Determine which primary view to show
  const isInRaceView =
    room !== null &&
    (room.phase === 'world_transition' ||
      room.phase === 'trap_placement' ||
      room.phase === 'countdown' ||
      room.phase === 'racing' ||
      room.phase === 'round_results' ||
      room.phase === 'match_victory');

  return (
    <div
      className={`w-full min-h-screen bg-slate-950 font-toy text-slate-100 ${
        isInRaceView ? 'h-screen w-screen overflow-hidden' : 'overflow-y-auto'
      }`}
    >
      {/* Lobby View (Character Selection & Room Join) */}
      {!isInRaceView ? (
        <LobbyView
          room={room}
          localPlayerId={network.localPlayerId}
          playerName={playerName}
          selectedChar={selectedChar}
          initialJoinCode={inviteCode}
          onUpdateName={handleUpdateName}
          onSelectCharacter={handleSelectCharacter}
          onCreateRoom={handleCreateRoom}
          onJoinRoom={handleJoinRoom}
          onToggleReady={handleToggleReady}
          onStartMatch={handleStartMatch}
          onAddBot={handleAddBot}
          onOpenAudioSettings={() => setShowAudioSettings(true)}
        />
      ) : (
        /* In-Game Active View */
        <GameCanvas
          room={room}
          localPlayerId={network.localPlayerId}
          onOpenAudioSettings={() => setShowAudioSettings(true)}
        />
      )}

      {/* Round Results / Match Victory Scoreboard Modal */}
      {room &&
        (room.phase === 'round_results' || room.phase === 'match_victory') && (
          <ScoreboardModal
            isMatchOver={room.phase === 'match_victory'}
            currentRound={room.currentRound}
            totalRounds={room.totalRounds}
            players={room.players}
            isHost={network.isHost()}
            onNextRound={handleNextRound}
            onRematch={handleRematch}
          />
        )}

      {/* Audio Settings Modal */}
      {showAudioSettings && (
        <AudioSettingsModal onClose={() => setShowAudioSettings(false)} />
      )}
    </div>
  );
}

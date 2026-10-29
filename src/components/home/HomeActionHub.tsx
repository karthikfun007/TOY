/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import {
  Play,
  Users,
  Crown,
  CheckCircle2,
  Circle,
  Bot,
  Sparkles,
  Link,
  Check,
  LogIn,
  Flag,
  Eye,
  EyeOff,
  Copy,
  Lock,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { CharacterVisualPreview, getCharacterInfo } from '../../game/characters';
import { RoomState } from '../../game/types';
import { audio } from '../../game/audio';
import { network, NetworkStatus } from '../../game/network';
import { getWorldById } from '../../game/worlds';

interface HomeActionHubProps {
  room: RoomState | null;
  localPlayerId: string;
  onCreateRoom: () => void;
  onJoinRoom: (code: string) => void;
  onToggleReady: () => void;
  onStartMatch: () => void;
  onAddBot: () => void;
  initialJoinCode?: string;
}

export const HomeActionHub: React.FC<HomeActionHubProps> = ({
  room,
  localPlayerId,
  onCreateRoom,
  onJoinRoom,
  onToggleReady,
  onStartMatch,
  onAddBot,
  initialJoinCode,
}) => {
  const [activeTab, setActiveTab] = useState<'quick' | 'join'>(initialJoinCode ? 'join' : 'quick');
  const [joinCodeInput, setJoinCodeInput] = useState(initialJoinCode || '');
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  // Default masked to protect room code from viewers, stream onlookers, or unauthorized spectators
  const [isCodeMasked, setIsCodeMasked] = useState(true);
  const [netStatus, setNetStatus] = useState<NetworkStatus>('idle');
  const [netMessage, setNetMessage] = useState<string>('');

  useEffect(() => {
    if (initialJoinCode) {
      setActiveTab('join');
      setJoinCodeInput(initialJoinCode);
    }
  }, [initialJoinCode]);

  useEffect(() => {
    const unsub = network.onStatusChange((status, msg) => {
      setNetStatus(status);
      setNetMessage(msg);
    });
    return unsub;
  }, []);

  const localPlayer = room ? room.players[localPlayerId] : null;
  const isHost = room ? room.hostId === localPlayerId : false;
  const playersList = room ? Object.values(room.players) : [];
  const readyCount = playersList.filter((p) => p.isReady).length;
  // Host can start anytime with 1 or more racers (solo or multiplayer)!
  const canStart = isHost && playersList.length >= 1;

  const handleCopyLink = () => {
    if (!room) return;
    const inviteLink = `${window.location.origin}${window.location.pathname}?room=${room.roomCode}`;
    navigator.clipboard.writeText(inviteLink);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleCopyCode = () => {
    if (!room) return;
    navigator.clipboard.writeText(room.roomCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  // Main Action handler for the giant PLAY button
  const handleMainPlayClick = () => {
    audio.playButtonClick();

    if (!room) {
      if (activeTab === 'join' && joinCodeInput.trim()) {
        onJoinRoom(joinCodeInput.trim());
      } else {
        onCreateRoom();
      }
    } else if (isHost) {
      // Host ALWAYS starts match directly! Never blocked by missing bots or ready toggles!
      onStartMatch();
    } else {
      // Guest toggles ready
      onToggleReady();
    }
  };

  return (
    <div className="w-full bg-gradient-to-b from-slate-900/95 via-indigo-950/90 to-slate-950/95 border-3 border-amber-400/80 rounded-3xl p-4 sm:p-5 shadow-2xl backdrop-blur-md space-y-4">
      {/* Game Mode Header */}
      <div className="flex items-center justify-between border-b border-white/10 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-yellow-400 text-slate-950 font-black shadow-md border-b-2 border-amber-600">
            <Flag className="w-4 h-4 stroke-[2.5]" />
          </div>
          <div>
            <h3 className="font-toy text-lg sm:text-xl font-black text-amber-300">
              5-Round Championship
            </h3>
            <p className="font-poppins text-xs text-sky-300 font-bold">
              Toybox Trouble · Obstacles & Secret Traps
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="font-poppins text-[9px] px-2.5 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/40 font-black">
            100% FREE P2P
          </span>
          <span className="font-poppins text-[9px] px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-black">
            LIVE ONLINE
          </span>
        </div>
      </div>

      {/* Case A: Not in Room Yet */}
      {!room ? (
        <div className="space-y-3.5">
          {initialJoinCode && (
            <div className="p-3 rounded-2xl bg-gradient-to-r from-sky-950 via-indigo-950 to-sky-950 border-2 border-sky-400/80 shadow-lg flex items-center justify-between gap-2 animate-pulse">
              <div className="flex items-center gap-2 min-w-0">
                <Sparkles className="w-4 h-4 text-amber-300 shrink-0" />
                <span className="text-xs font-poppins font-black text-sky-200 truncate">
                  Invited to Room: <strong className="text-amber-300">{initialJoinCode}</strong>
                </span>
              </div>
              <button
                onClick={() => {
                  audio.playButtonClick();
                  onJoinRoom(initialJoinCode);
                }}
                className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-400 text-slate-950 text-xs font-arcade font-black shadow-md border-b-2 border-amber-600 active:border-b-0 cursor-pointer shrink-0"
              >
                {netStatus === 'connecting' ? 'CONNECTING...' : 'JOIN NOW'}
              </button>
            </div>
          )}

          {/* Mode Tabs: Quick Play vs Join Code */}
          <div className="grid grid-cols-2 gap-2 p-1.5 rounded-2xl bg-slate-950 border-2 border-slate-800">
            <button
              onClick={() => {
                audio.playButtonClick();
                setActiveTab('quick');
              }}
              className={`py-2 rounded-xl font-poppins font-black text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                activeTab === 'quick'
                  ? 'bg-gradient-to-r from-amber-400 to-yellow-400 text-slate-950 shadow-md border-b-2 border-amber-600'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              <span>Host / Quick Race</span>
            </button>
            <button
              onClick={() => {
                audio.playButtonClick();
                setActiveTab('join');
              }}
              className={`py-2 rounded-xl font-poppins font-black text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                activeTab === 'join'
                  ? 'bg-gradient-to-r from-sky-400 to-cyan-400 text-slate-950 shadow-md border-b-2 border-sky-600'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <LogIn className="w-4 h-4" />
              <span>Join with Code</span>
            </button>
          </div>

          {activeTab === 'quick' ? (
            <div className="p-3 rounded-2xl bg-slate-950/80 border border-amber-500/30 text-xs text-slate-300 space-y-1 text-center">
              <p className="text-amber-200 font-bold">
                Jump straight in or invite friends with a link!
              </p>
              <p className="text-[11px] text-slate-400">
                Hit PLAY to open your race lobby. You can add smart toy bots or send the room link to friends.
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              <label className="block text-[11px] font-semibold text-slate-400 uppercase">
                Enter Room Code to Join:
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  maxLength={12}
                  value={joinCodeInput}
                  onChange={(e) => setJoinCodeInput(e.target.value.toUpperCase())}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && joinCodeInput.trim()) {
                      audio.playButtonClick();
                      onJoinRoom(joinCodeInput);
                    }
                  }}
                  placeholder="e.g. TOY-4821 or 4821"
                  className="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-950 border-2 border-slate-700 focus:border-amber-400 text-white font-mono text-sm uppercase focus:outline-none placeholder:text-slate-600"
                />
                <button
                  disabled={!joinCodeInput.trim()}
                  onClick={() => {
                    audio.playButtonClick();
                    onJoinRoom(joinCodeInput);
                  }}
                  className={`px-4 py-2.5 rounded-xl font-toy font-extrabold text-xs transition-all cursor-pointer border-b-4 flex items-center gap-1.5 ${
                    joinCodeInput.trim()
                      ? 'bg-sky-500 hover:bg-sky-400 text-white shadow-md border-sky-700 active:border-b-0 active:translate-y-1'
                      : 'bg-slate-800 text-slate-600 border-slate-900 cursor-not-allowed'
                  }`}
                >
                  {netStatus === 'connecting' ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-300" />
                      <span>Connecting...</span>
                    </>
                  ) : (
                    <span>Join Room</span>
                  )}
                </button>
              </div>

              {/* Real-time Join Status Alert */}
              {netStatus === 'connecting' && (
                <div className="flex items-center gap-2 p-2 rounded-xl bg-sky-950/70 border border-sky-500/40 text-[11px] text-sky-200 animate-pulse">
                  <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0 text-sky-400" />
                  <span>Connecting to host via high-speed WebRTC...</span>
                </div>
              )}

              {netStatus === 'error' && (
                <div className="flex items-start gap-2 p-2 rounded-xl bg-rose-950/70 border border-rose-500/40 text-[11px] text-rose-200">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block">Could not join room</span>
                    <span>{netMessage || 'Check the room code and make sure the host has opened the lobby!'}</span>
                  </div>
                </div>
              )}

              {netStatus === 'full' && (
                <div className="flex items-center gap-2 p-2 rounded-xl bg-amber-950/70 border border-amber-500/40 text-[11px] text-amber-200">
                  <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>Room is full! Maximum 6 racers per match.</span>
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        /* Case B: Inside Active Room Lobby */
        <div className="space-y-3.5">
          {/* Streamer Privacy Room Code Card (Hidden by default from screen) */}
          <div className="p-3 sm:p-3.5 rounded-2xl bg-slate-950 border-2 border-amber-500/60 shadow-xl space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-[10px] font-poppins font-black text-amber-300 uppercase tracking-wider">
                  Private Room Code (Stream Safe)
                </span>
              </div>
              <span className="text-[9px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-poppins font-black border border-emerald-500/40">
                P2P ENCRYPTED
              </span>
            </div>

            <div className="flex items-center justify-between gap-2 p-2.5 rounded-2xl bg-slate-900 border-2 border-slate-800">
              <div className="min-w-0">
                {isCodeMasked ? (
                  <div className="flex items-center gap-2">
                    <span className="font-poppins text-2xl text-amber-400 tracking-widest font-black select-none">
                      ••••••••
                    </span>
                    <span className="text-[10px] font-poppins text-slate-400 font-bold hidden sm:inline">
                      (Hidden from viewers)
                    </span>
                  </div>
                ) : (
                  <span className="font-poppins text-xl sm:text-2xl text-amber-300 font-black tracking-wider select-all">
                    {room.roomCode}
                  </span>
                )}
              </div>

              {/* Eye Toggle to Show / Hide Code */}
              <button
                onClick={() => {
                  audio.playButtonClick();
                  setIsCodeMasked(!isCodeMasked);
                }}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-poppins font-bold cursor-pointer border border-slate-700 transition-all shrink-0 shadow-sm"
                title={isCodeMasked ? 'Reveal code on screen' : 'Hide code from screen'}
              >
                {isCodeMasked ? (
                  <>
                    <Eye className="w-3.5 h-3.5 text-amber-400" />
                    <span>Show</span>
                  </>
                ) : (
                  <>
                    <EyeOff className="w-3.5 h-3.5 text-slate-400" />
                    <span>Hide</span>
                  </>
                )}
              </button>
            </div>

            {/* Quick Share Buttons: Copy Code & Copy Direct Link */}
            <div className="grid grid-cols-2 gap-2 pt-0.5">
              <button
                onClick={handleCopyCode}
                className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs font-poppins font-black border border-amber-500/40 active:translate-y-0.5 transition-all cursor-pointer shadow-sm"
              >
                {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedCode ? 'Code Copied!' : 'Copy Code'}</span>
              </button>

              <button
                onClick={handleCopyLink}
                className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 text-xs font-poppins font-black shadow-md border-b-2 border-emerald-700 active:border-b-0 active:translate-y-0.5 transition-all cursor-pointer"
              >
                {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Link className="w-3.5 h-3.5" />}
                <span>{copiedLink ? 'Link Copied!' : 'Copy Link'}</span>
              </button>
            </div>
          </div>

          {/* Racers in Lobby */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5 text-xs font-poppins font-black text-amber-300">
                <Users className="w-4 h-4 text-amber-400" />
                <span>Racers ({playersList.length}/6)</span>
              </div>
              {isHost && playersList.length < 6 && (
                <button
                  onClick={() => {
                    audio.playButtonClick();
                    onAddBot();
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 text-xs font-poppins font-black transition-all cursor-pointer border border-purple-500/40 shadow-sm"
                >
                  <Bot className="w-3.5 h-3.5" />
                  + Add Bot
                </button>
              )}
            </div>

            <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
              {playersList.map((p) => {
                const charInfo = getCharacterInfo(p.characterId);
                const isSelf = p.id === localPlayerId;
                return (
                  <div
                    key={p.id}
                    className={`flex items-center justify-between p-2 rounded-xl border transition-all ${
                      isSelf
                        ? 'bg-amber-500/15 border-amber-400/70 shadow'
                        : 'bg-slate-950/80 border-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <CharacterVisualPreview
                        charId={p.characterId}
                        scale={0.8}
                        animated={true}
                        width={30}
                        height={30}
                        className="rounded-lg bg-slate-900 border border-slate-700 shrink-0"
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-poppins font-black text-xs text-white truncate max-w-[120px]">
                            {p.name} {isSelf && '(You)'}
                          </span>
                          {p.isHost && (
                            <span title="Host">
                              <Crown className="w-3.5 h-3.5 text-amber-400 inline" />
                            </span>
                          )}
                          {p.isBot && (
                            <span className="text-[8px] px-1.5 py-0.2 rounded bg-purple-500/30 text-purple-300 font-poppins font-black">
                              BOT
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] font-poppins text-amber-300/80 font-bold block truncate">
                          {charInfo.name}
                        </span>
                      </div>
                    </div>

                    <div className="shrink-0">
                      {p.isReady ? (
                        <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-poppins font-black">
                          <CheckCircle2 className="w-3.5 h-3.5" /> READY
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-[10px] text-amber-400/70 font-poppins font-bold">
                          <Circle className="w-3.5 h-3.5" /> WAITING
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* 16-Bit Retro Arcade Stage Preview Card */}
      {(() => {
        const activeWorld = room ? getWorldById(room.levelId) : getWorldById('world_playground');
        return (
          <div className="p-3 rounded-2xl bg-slate-950/90 border-2 border-indigo-900/60 shadow-inner flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div
                className="flex h-11 w-11 items-center justify-center rounded-xl text-xl shadow-md shrink-0 border border-white/20"
                style={{ backgroundColor: activeWorld.themeColor }}
              >
                {activeWorld.badgeIcon}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="font-arcade text-[8px] text-amber-400">
                    STAGE {activeWorld.worldNumber || 1}
                  </span>
                  <span className="text-[10px] text-yellow-400">
                    {'★'.repeat(activeWorld.difficultyStars || 1)}{'☆'.repeat(5 - (activeWorld.difficultyStars || 1))}
                  </span>
                </div>
                <h4 className="font-arcade text-xs text-white truncate leading-tight mt-0.5">
                  {activeWorld.name}
                </h4>
                <p className="text-[10px] font-poppins text-cyan-300/90 truncate">
                  {activeWorld.subtitle}
                </p>
              </div>
            </div>

            <div className="shrink-0 text-right">
              <span className="font-arcade text-[8px] px-2 py-0.5 rounded bg-indigo-950 text-emerald-400 border border-emerald-500/40 block">
                READY
              </span>
              <span className="text-[9px] font-poppins text-slate-400 mt-0.5 block">
                {activeWorld.width}m Course
              </span>
            </div>
          </div>
        );
      })()}

      {/* ----------------- THE GIANT 16-BIT 3D PLAY BUTTON ----------------- */}
      <div className="pt-1">
        <button
          onClick={handleMainPlayClick}
          className={`relative w-full py-4 sm:py-4.5 rounded-2xl font-arcade text-base sm:text-lg transition-all cursor-pointer overflow-hidden flex items-center justify-center gap-2.5 shadow-2xl active:translate-y-1.5 arcade-btn-push group ${
            !room
              ? 'bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 hover:from-amber-300 hover:to-yellow-300 text-slate-950 border-b-8 border-amber-700 active:border-b-2'
              : isHost
              ? 'bg-gradient-to-r from-emerald-400 via-teal-400 to-emerald-500 hover:from-emerald-300 hover:to-teal-300 text-slate-950 border-b-8 border-emerald-700 active:border-b-2'
              : localPlayer?.isReady
              ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-b-8 border-slate-950 active:border-b-2'
              : 'bg-gradient-to-r from-emerald-400 via-teal-400 to-emerald-500 hover:from-emerald-300 hover:to-teal-300 text-slate-950 border-b-8 border-emerald-700 active:border-b-2'
          }`}
        >
          {/* Light Shimmer Effect */}
          <div className="pointer-events-none absolute inset-0 w-1/3 bg-white/40 blur-sm transform -skew-x-12 animate-shimmer" />

          {/* Button Icon & Label */}
          <Play className="w-5 h-5 sm:w-6 sm:h-6 fill-current transition-transform group-hover:scale-110" />

          <span>
            {!room
              ? activeTab === 'join' && joinCodeInput.trim()
                ? `JOIN ROOM ${joinCodeInput.trim()}`
                : 'CREATE & PLAY'
              : isHost
              ? playersList.length === 1
                ? 'START SOLO RACE!'
                : `START RACE (${playersList.length}/6 PLAYERS)`
              : localPlayer?.isReady
              ? 'READY (WAITING HOST)'
              : 'READY UP!'}
          </span>
        </button>

        {/* Dynamic Contextual Helper Subtitle */}
        <p className="text-[11px] text-center text-amber-200/80 font-medium mt-2">
          {!room
            ? '⚡ 7 Worlds · Solo & Multiplayer · 1-6 Players · Pure Platforming Fun'
            : isHost && playersList.length === 1
            ? '🎮 Solo Mode: Click button to race against the clock! Or click "+ Add Bot" anytime.'
            : isHost
            ? `🚀 Ready to roll! Click to start Round 1 with ${playersList.length} racers!`
            : '🏁 You are ready! Host will launch the match soon.'}
        </p>
      </div>
    </div>
  );
};

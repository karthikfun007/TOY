/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Volume2, VolumeX, X } from 'lucide-react';
import { audio } from '../game/audio';

interface AudioSettingsModalProps {
  onClose: () => void;
}

export const AudioSettingsModal: React.FC<AudioSettingsModalProps> = ({ onClose }) => {
  const current = audio.getSettings();
  const [isMuted, setIsMuted] = useState(current.isMuted);
  const [masterVol, setMasterVol] = useState(current.masterVolume);
  const [musicVol, setMusicVol] = useState(current.musicVolume);
  const [sfxVol, setSfxVol] = useState(current.sfxVolume);

  const handleMuteToggle = () => {
    const next = audio.toggleMute();
    setIsMuted(next);
  };

  const handleMasterChange = (val: number) => {
    setMasterVol(val);
    audio.setMasterVolume(val);
  };

  const handleMusicChange = (val: number) => {
    setMusicVol(val);
    audio.setMusicVolume(val);
  };

  const handleSfxChange = (val: number) => {
    setSfxVol(val);
    audio.setSfxVolume(val);
    audio.playButtonClick();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-3xl border-4 border-amber-400 bg-gradient-to-b from-slate-900 via-indigo-950 to-slate-900 p-6 sm:p-7 shadow-[0_20px_50px_rgba(0,0,0,0.8)] text-slate-100">
        <div className="flex items-center justify-between pb-4 border-b border-indigo-900/60">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 text-slate-950 border-b-3 border-amber-600 shadow-md">
              <Volume2 className="w-6 h-6" />
            </div>
            <h2 className="font-toy text-2xl sm:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-300 to-yellow-400">
              Sound Settings
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all border-b-2 border-slate-950 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-6 space-y-5">
          {/* Mute Toggle Button */}
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-950/70 border border-indigo-900/40">
            <span className="font-poppins font-bold text-sm text-slate-200">Master Sound Toggle</span>
            <button
              onClick={handleMuteToggle}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-poppins font-black text-xs transition-all border-b-3 cursor-pointer ${
                isMuted
                  ? 'bg-rose-500/20 text-rose-300 border-rose-600 hover:bg-rose-500/30'
                  : 'bg-emerald-500/20 text-emerald-300 border-emerald-600 hover:bg-emerald-500/30'
              }`}
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              {isMuted ? 'MUTED' : 'UNMUTED'}
            </button>
          </div>

          {/* Master Volume */}
          <div>
            <div className="flex justify-between text-xs font-poppins font-bold mb-1.5 text-slate-300">
              <span>Master Volume</span>
              <span className="font-poppins font-black text-xs text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/30">
                {Math.round(masterVol * 100)}%
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={masterVol}
              onChange={(e) => handleMasterChange(parseFloat(e.target.value))}
              className="w-full accent-amber-400 h-2.5 bg-slate-800 rounded-lg cursor-pointer"
            />
          </div>

          {/* Music Volume */}
          <div>
            <div className="flex justify-between text-xs font-poppins font-bold mb-1.5 text-slate-300">
              <span>Chiptune BGM Volume</span>
              <span className="font-poppins font-black text-xs text-cyan-300 bg-cyan-500/10 px-2 py-0.5 rounded-md border border-cyan-500/30">
                {Math.round(musicVol * 100)}%
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={musicVol}
              onChange={(e) => handleMusicChange(parseFloat(e.target.value))}
              className="w-full accent-cyan-400 h-2.5 bg-slate-800 rounded-lg cursor-pointer"
            />
          </div>

          {/* SFX Volume */}
          <div>
            <div className="flex justify-between text-xs font-poppins font-bold mb-1.5 text-slate-300">
              <span>Cartoon Sound Effects</span>
              <span className="font-poppins font-black text-xs text-fuchsia-300 bg-fuchsia-500/10 px-2 py-0.5 rounded-md border border-fuchsia-500/30">
                {Math.round(sfxVol * 100)}%
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={sfxVol}
              onChange={(e) => handleSfxChange(parseFloat(e.target.value))}
              className="w-full accent-fuchsia-400 h-2.5 bg-slate-800 rounded-lg cursor-pointer"
            />
          </div>
        </div>

        <div className="mt-8">
          <button
            onClick={() => {
              audio.playButtonClick();
              onClose();
            }}
            className="w-full py-3.5 rounded-2xl bg-gradient-to-b from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-poppins font-black text-base shadow-lg border-b-4 border-amber-600 active:border-b-0 active:translate-y-1 transition-all cursor-pointer"
          >
            Save & Return
          </button>
        </div>
      </div>
    </div>
  );
};

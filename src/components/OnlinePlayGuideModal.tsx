/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Globe, Users, Copy, Check, ExternalLink, Sparkles, X, Terminal, ArrowRight, ShieldCheck } from 'lucide-react';

interface OnlinePlayGuideModalProps {
  roomCode?: string | null;
  onClose: () => void;
}

export const OnlinePlayGuideModal: React.FC<OnlinePlayGuideModalProps> = ({ roomCode, onClose }) => {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  const baseUrl = window.location.origin;
  const inviteLink = roomCode ? `${baseUrl}?room=${roomCode}` : baseUrl;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(inviteLink);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleCopyCode = () => {
    if (!roomCode) return;
    navigator.clipboard.writeText(roomCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-3 sm:p-6">
      <div className="w-full max-w-3xl max-h-[90vh] rounded-3xl border-4 border-amber-400 bg-slate-900 shadow-2xl flex flex-col text-slate-100 overflow-hidden">
        {/* Top Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-950/70">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-yellow-500 text-slate-950 shadow-lg">
              <Globe className="w-6 h-6" />
            </div>
            <div>
              <h2 className="font-toy text-xl sm:text-2xl font-bold text-amber-300">
                Play With Friends Online & Host Your Website
              </h2>
              <p className="text-xs text-slate-400">
                Share this live game now or deploy your own custom website in 2 minutes
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6 text-sm text-slate-300">
          {/* Method 1: Play Instantly Right Now */}
          <div className="p-5 rounded-2xl bg-gradient-to-br from-amber-500/15 via-slate-800/80 to-slate-900 border-2 border-amber-400/60 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-pixel text-xs text-amber-300 uppercase tracking-wider">
                <Sparkles className="w-4 h-4 text-amber-400" />
                Method 1 · Play Instantly Over The Internet (No Setup)
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/40">
                LIVE NOW
              </span>
            </div>

            <p className="text-xs text-slate-200 leading-relaxed">
              This game is <strong>already hosted online on Google Cloud Run</strong>! It connects players across different computers anywhere in the world using <strong>WebRTC direct peer-to-peer data channels</strong>.
            </p>

            {/* Quick Share Box */}
            <div className="space-y-2">
              <span className="text-[11px] font-semibold text-slate-400 uppercase">
                Your Direct Game Link:
              </span>
              <div className="flex flex-col sm:flex-row items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={inviteLink}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 font-mono text-xs text-amber-300 select-all"
                />
                <button
                  onClick={handleCopyLink}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-toy font-bold text-xs shadow-md active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap"
                >
                  {copiedLink ? <Check className="w-4 h-4 text-emerald-950" /> : <Copy className="w-4 h-4" />}
                  {copiedLink ? 'Link Copied!' : 'Copy Game Link'}
                </button>
              </div>
            </div>

            {roomCode && (
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950/80 border border-slate-800">
                <div className="text-xs">
                  <span className="text-slate-400">Active Room Code: </span>
                  <span className="font-pixel text-amber-400 font-bold ml-1">{roomCode}</span>
                </div>
                <button
                  onClick={handleCopyCode}
                  className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-[11px] font-semibold text-slate-300 border border-slate-700"
                >
                  {copiedCode ? 'Code Copied!' : 'Copy Code Only'}
                </button>
              </div>
            )}

            <div className="text-xs text-slate-400 bg-slate-950/40 p-3 rounded-xl border border-slate-800/80 space-y-1">
              <div className="font-bold text-slate-200">How your friends join:</div>
              <ol className="list-decimal list-inside space-y-0.5 text-[11px]">
                <li>Send them the link above via Discord, WhatsApp, or iMessage.</li>
                <li>They open the link in Chrome, Edge, Safari, or Firefox on their computer or laptop.</li>
                <li>They enter the Room Code (or it auto-fills with the invite link) and click <strong>Join</strong>!</li>
              </ol>
            </div>
          </div>

          {/* Method 2: Deploy to Your Own Permanent Website (Vercel / Netlify / GitHub) */}
          <div className="p-5 rounded-2xl bg-slate-800/70 border border-slate-700 space-y-4">
            <div className="flex items-center gap-2 font-pixel text-xs text-sky-400 uppercase tracking-wider">
              <Users className="w-4 h-4" />
              Method 2 · Host on Your Own Custom Domain for Free
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              If you want your own permanent URL (like <code className="text-sky-300 bg-slate-950 px-1 py-0.5 rounded">my-racing-game.vercel.app</code> or your own <code className="text-amber-300 bg-slate-950 px-1 py-0.5 rounded">.com</code> domain), you can deploy this project for free using <strong>Vercel</strong> or <strong>Netlify</strong>.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
                <span className="font-pixel text-[10px] text-amber-400">STEP 1</span>
                <h4 className="font-bold text-white text-xs">Push to GitHub</h4>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Put your project folder into a free repository on <a href="https://github.com" target="_blank" rel="noreferrer" className="text-sky-400 underline">GitHub.com</a> using <code className="text-slate-200">git push</code>.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
                <span className="font-pixel text-[10px] text-sky-400">STEP 2</span>
                <h4 className="font-bold text-white text-xs">Import to Vercel</h4>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Go to <a href="https://vercel.com" target="_blank" rel="noreferrer" className="text-sky-400 underline">Vercel.com</a>, log in with GitHub, click <strong>"Add New Project"</strong>, and pick your repository.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
                <span className="font-pixel text-[10px] text-emerald-400">STEP 3</span>
                <h4 className="font-bold text-white text-xs">Click Deploy!</h4>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Vercel builds your React + Vite game automatically in ~30 seconds and gives you a free live SSL HTTPS URL!
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                <span className="text-[11px] text-emerald-200">
                  <strong>100% Free Peer-to-Peer:</strong> You never need to pay for game servers or backend hosting.
                </span>
              </div>
            </div>
          </div>

          {/* Section 3: Why Is This Free? (Technology Architecture) */}
          <div className="p-5 rounded-2xl bg-slate-800/80 border border-amber-400/30 space-y-3">
            <div className="flex items-center gap-2 font-pixel text-xs text-amber-300 uppercase tracking-wider">
              <Sparkles className="w-4 h-4 text-amber-400" />
              How Is This Multiplayer 100% Free to Play & Host?
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1">
                <span className="font-bold text-amber-300">1. Peer-to-Peer WebRTC DataChannels</span>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Instead of routing all player movement through an expensive paid server cluster in the cloud, players' browsers connect <strong>directly to each other</strong>. Data flows straight from your device to your friends with zero middleman servers.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1">
                <span className="font-bold text-sky-300">2. Free Google STUN Signaling</span>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  To connect through home routers and firewalls, WebRTC uses Google's public STUN infrastructure (<code className="text-sky-300">stun.l.google.com</code>). Google provides this globally as a free internet standard without any subscription fees.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1">
                <span className="font-bold text-emerald-300">3. Host-Authoritative Simulation</span>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  The player who creates the room runs the physics, traps, AI bot racers, and moving trains/saws right inside their own browser. No paid AWS or GCP dedicated gaming VMs are needed.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1">
                <span className="font-bold text-purple-300">4. Free Static Hosting Forever</span>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Because the game is a single client bundle (Vite + React), you can host it forever for free on Vercel, Netlify, Cloudflare Pages, or GitHub Pages with unlimited personal use.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
          <span className="text-xs text-slate-400">
            Have fun racing and placing sneaky traps with your friends!
          </span>
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-toy font-bold text-sm shadow-md transition-all cursor-pointer"
          >
            Got it, Let's Play!
          </button>
        </div>
      </div>
    </div>
  );
};

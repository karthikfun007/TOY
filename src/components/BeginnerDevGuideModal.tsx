/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { BookOpen, Copy, Check, Terminal, FolderTree, AlertCircle, Sparkles, X, ChevronRight } from 'lucide-react';

interface BeginnerDevGuideModalProps {
  onClose: () => void;
}

export const BeginnerDevGuideModal: React.FC<BeginnerDevGuideModalProps> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState<'windows_software' | 'folder_structure' | 'stage1_code' | 'commands' | 'troubleshooting'>('windows_software');
  const [copiedFile, setCopiedFile] = useState<string | null>(null);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedFile(label);
    setTimeout(() => setCopiedFile(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-3 sm:p-6">
      <div className="w-full max-w-4xl h-[88vh] rounded-3xl border-4 border-amber-500 bg-slate-900 shadow-2xl flex flex-col text-slate-100 overflow-hidden">
        {/* Top Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/40">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <h2 className="font-toy text-xl sm:text-2xl font-bold text-amber-300">
                Senior Game Dev Guide: Toybox Trouble
              </h2>
              <p className="text-xs text-slate-400">
                From Absolute Zero to Windows PC Setup & Stage 1 Playable Platformer
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 px-5 pt-3 border-b border-slate-800 bg-slate-950/30 overflow-x-auto">
          {[
            { id: 'windows_software', label: '1. Windows Software', icon: Terminal },
            { id: 'folder_structure', label: '2. Folder Structure', icon: FolderTree },
            { id: 'stage1_code', label: '3. Complete Code Files', icon: Sparkles },
            { id: 'commands', label: '4. Run Commands', icon: ChevronRight },
            { id: 'troubleshooting', label: '5. Fix Common Errors', icon: AlertCircle },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-xs font-semibold whitespace-nowrap transition-all border-b-2 ${
                  isActive
                    ? 'border-amber-400 bg-slate-800 text-amber-300'
                    : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-sm text-slate-300">
          {activeTab === 'windows_software' && (
            <div className="space-y-5">
              <h3 className="font-toy text-lg font-bold text-amber-300">
                Essential Software You Need on Windows & Why
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700 space-y-2">
                  <span className="font-pixel text-xs text-emerald-400">01. Node.js (LTS)</span>
                  <h4 className="font-bold text-white">JavaScript Runtime</h4>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    <strong>Why you need it:</strong> Browsers run JavaScript, but to run a development server, bundle assets, and execute your game backend, you need Node.js installed on your Windows machine.
                  </p>
                  <p className="text-[11px] text-amber-300 font-mono bg-slate-900 p-2 rounded">
                    Download from: nodejs.org (choose LTS version, e.g. v20 or v22).
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700 space-y-2">
                  <span className="font-pixel text-xs text-sky-400">02. VS Code</span>
                  <h4 className="font-bold text-white">Code Editor</h4>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    <strong>Why you need it:</strong> Visual Studio Code gives you syntax highlighting, auto-complete, integrated terminal, and file explorer to edit game code comfortably.
                  </p>
                  <p className="text-[11px] text-sky-300 font-mono bg-slate-900 p-2 rounded">
                    Download from: code.visualstudio.com
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700 space-y-2">
                  <span className="font-pixel text-xs text-purple-400">03. Git for Windows</span>
                  <h4 className="font-bold text-white">Version Control & Terminal</h4>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    <strong>Why you need it:</strong> Provides Git Bash, a clean command-line shell on Windows that matches developer standards.
                  </p>
                  <p className="text-[11px] text-purple-300 font-mono bg-slate-900 p-2 rounded">
                    Download from: git-scm.com/download/win
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30">
                <h4 className="font-bold text-amber-300 text-sm flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400" /> Verify Your Windows Installation
                </h4>
                <p className="text-xs text-slate-300 mt-1">
                  Open <strong>Command Prompt</strong> or <strong>PowerShell</strong> on Windows (press Windows Key + R, type <code className="bg-slate-900 px-1 py-0.5 rounded text-amber-300">cmd</code>, and press Enter). Then type:
                </p>
                <pre className="mt-2 p-3 bg-slate-950 rounded-xl font-mono text-xs text-emerald-400 overflow-x-auto">
{`node -v
npm -v`}
                </pre>
                <p className="text-xs text-slate-400 mt-1">
                  If you see numbers like <code className="text-white">v20.12.0</code> and <code className="text-white">10.5.0</code>, you are 100% ready!
                </p>
              </div>
            </div>
          )}

          {activeTab === 'folder_structure' && (
            <div className="space-y-4">
              <h3 className="font-toy text-lg font-bold text-amber-300">
                Project Folder Structure for Beginners
              </h3>
              <p className="text-xs text-slate-300">
                Create a new folder on your PC named <code className="text-amber-300 bg-slate-950 px-1.5 py-0.5 rounded font-mono">toybox-trouble</code>. Inside it, organize the project like this:
              </p>

              <pre className="p-4 bg-slate-950 rounded-2xl border border-slate-800 font-mono text-xs text-sky-300 leading-relaxed overflow-x-auto">
{`toybox-trouble/
├── index.html               # Main browser HTML entry point with canvas and fonts
├── package.json             # Project dependencies and startup scripts
├── tsconfig.json            # TypeScript configuration
├── vite.config.ts           # Fast Vite build server setup
└── src/
    ├── main.tsx             # React / Game root mounting file
    ├── App.tsx              # Game container and phase controller
    ├── index.css            # Pixel art CSS & retro styling
    ├── game/
    │   ├── types.ts         # Player, Platform, Trap, and Level types
    │   ├── audio.ts         # Procedural Web Audio chiptune synthesizer
    │   ├── characters.ts    # 6 Toybox racer designs and sprite renderer
    │   ├── levelData.ts     # Level 01: Toybox Trouble geometry & platforms
    │   ├── physics.ts       # Platformer physics, jumping, and collision
    │   ├── camera.ts        # Dynamic shared group camera with auto-zoom
    │   ├── renderer.ts      # 60fps pixel-art canvas renderer
    │   └── network.ts       # Room synchronization & bot racer AI
    └── components/
        ├── GameCanvas.tsx   # Isolated game canvas & input bindings
        ├── LobbyView.tsx    # Character select & room code lobby
        ├── ScoreboardModal.tsx # 5-round scoreboard & results
        └── TrapPlacementOverlay.tsx # 12-sec secret trap placement`}
              </pre>
            </div>
          )}

          {activeTab === 'stage1_code' && (
            <div className="space-y-4">
              <h3 className="font-toy text-lg font-bold text-amber-300">
                Stage 1 Standalone Prototype: Complete Files
              </h3>
              <p className="text-xs text-slate-300">
                Here are the core files configured for a working local prototype where your racer can run, jump, land on wooden shelves and building blocks, ride bounce pads, and reach the checkered finish line!
              </p>

              <div className="space-y-3">
                {/* File 1: package.json */}
                <div className="rounded-xl border border-slate-800 bg-slate-950 overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-2 bg-slate-800/80 border-b border-slate-700">
                    <span className="font-mono text-xs text-amber-300 font-bold">package.json</span>
                    <button
                      onClick={() =>
                        copyToClipboard(
                          `{
  "name": "toybox-trouble",
  "private": true,
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "lucide-react": "^0.546.0",
    "canvas-confetti": "^1.9.4"
  },
  "devDependencies": {
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "@types/canvas-confetti": "^1.9.0",
    "@vitejs/plugin-react": "^6.1.1",
    "@tailwindcss/vite": "^4.3.3",
    "tailwindcss": "^4.3.3",
    "typescript": "^5.7.0",
    "vite": "^8.3.0"
  }
}`,
                          'package.json'
                        )
                      }
                      className="flex items-center gap-1 px-2.5 py-1 rounded bg-slate-700 hover:bg-slate-600 text-[11px] font-semibold text-slate-200"
                    >
                      {copiedFile === 'package.json' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      {copiedFile === 'package.json' ? 'Copied!' : 'Copy Code'}
                    </button>
                  </div>
                  <pre className="p-4 text-xs font-mono text-slate-300 max-h-48 overflow-y-auto">
{`{
  "name": "toybox-trouble",
  "private": true,
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "lucide-react": "^0.546.0",
    "canvas-confetti": "^1.9.4"
  },
  "devDependencies": {
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "@types/canvas-confetti": "^1.9.0",
    "@vitejs/plugin-react": "^6.1.1",
    "@tailwindcss/vite": "^4.3.3",
    "tailwindcss": "^4.3.3",
    "typescript": "^5.7.0",
    "vite": "^8.3.0"
  }
}`}
                  </pre>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'commands' && (
            <div className="space-y-4">
              <h3 className="font-toy text-lg font-bold text-amber-300">
                Step-by-Step Windows Command Line Guide
              </h3>

              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-slate-800/70 border border-slate-700">
                  <h4 className="font-bold text-white text-sm mb-1">Step 1: Open Terminal in your Project Folder</h4>
                  <p className="text-xs text-slate-300">
                    In Windows File Explorer, open your <code className="text-amber-300">toybox-trouble</code> folder, click the address bar at the top, type <code className="bg-slate-950 px-1 py-0.5 rounded text-amber-400 font-mono">cmd</code>, and press Enter. A command prompt opens directly in that folder!
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-800/70 border border-slate-700">
                  <h4 className="font-bold text-white text-sm mb-1">Step 2: Install Packages</h4>
                  <pre className="p-3 bg-slate-950 rounded-xl font-mono text-xs text-emerald-400">
                    npm install
                  </pre>
                  <p className="text-xs text-slate-400 mt-1">
                    This downloads React, Vite, Tailwind, and sound packages into a <code className="text-slate-300">node_modules</code> folder.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-800/70 border border-slate-700">
                  <h4 className="font-bold text-white text-sm mb-1">Step 3: Launch Local Game Server</h4>
                  <pre className="p-3 bg-slate-950 rounded-xl font-mono text-xs text-emerald-400">
                    npm run dev
                  </pre>
                  <p className="text-xs text-slate-400 mt-1">
                    You will see a link: <code className="text-sky-400">http://localhost:5173</code> (or port 3000). Hold Ctrl and click it to open the game in Chrome or Edge!
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'troubleshooting' && (
            <div className="space-y-4">
              <h3 className="font-toy text-lg font-bold text-amber-300">
                How to Fix Common Beginner Errors
              </h3>

              <div className="space-y-3">
                <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700">
                  <span className="font-mono text-xs text-rose-400 font-bold">Error: 'node' is not recognized as an internal or external command</span>
                  <p className="text-xs text-slate-300 mt-1">
                    <strong>Fix:</strong> When installing Node.js from nodejs.org, make sure the checkbox "Automatically install the necessary tools" and "Add to PATH" are checked. Restart your command prompt or computer after installing.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700">
                  <span className="font-mono text-xs text-rose-400 font-bold">Error: Port 3000 or 5173 is already in use</span>
                  <p className="text-xs text-slate-300 mt-1">
                    <strong>Fix:</strong> Another program or terminal window is running. Press <code className="text-amber-300">Ctrl + C</code> in that terminal to stop it, or run Vite on a different port using <code className="text-emerald-400">npx vite --port 3001</code>.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700">
                  <span className="font-mono text-xs text-rose-400 font-bold">Sound doesn't play right away</span>
                  <p className="text-xs text-slate-300 mt-1">
                    <strong>Fix:</strong> Modern web browsers block audio from playing automatically until the user clicks or presses a key. Click anywhere on the screen or press Space to enable the audio context!
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
          <span className="text-xs text-slate-400">
            You can also test the entire game directly inside this browser preview right now!
          </span>
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-toy font-bold text-sm shadow-lg transition-all"
          >
            Back to Game
          </button>
        </div>
      </div>
    </div>
  );
};

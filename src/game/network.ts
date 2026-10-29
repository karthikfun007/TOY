/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Peer, type DataConnection } from 'peerjs';
import { CHARACTERS } from './characters';
import { LevelData } from './levelData';
import { getWorldById, getWorldForRound, WORLD_TRAINING } from './worlds';
import {
  resetMovingHazards,
  resetPlatforms,
  updateCollapsingPlatforms,
  updateMovingHazards,
  updatePlayerPhysics,
} from './physics';
import { CharacterId, PlacedTrap, PlayerInput, PlayerState, RoomState, TrapType } from './types';

export const ROUND_POINTS = [10, 7, 5, 3, 2, 1];

// High-availability global STUN servers for reliable NAT & firewall traversal
const PEER_CONFIG = {
  debug: 0,
  config: {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      { urls: 'stun:stun2.l.google.com:19302' },
      { urls: 'stun:stun3.l.google.com:19302' },
      { urls: 'stun:stun4.l.google.com:19302' },
      { urls: 'stun:stun.cloudflare.com:3478' },
      { urls: 'stun:global.stun.twilio.com:3478' },
    ],
    iceCandidatePoolSize: 10,
  },
};

export type NetworkStatus = 'idle' | 'connecting' | 'connected' | 'error' | 'full';

export class NetworkManager {
  public localPlayerId: string;
  public room: RoomState | null = null;
  private channel: BroadcastChannel | null = null;
  private onStateChangeCallbacks: ((room: RoomState) => void)[] = [];
  private onStatusCallbacks: ((status: NetworkStatus, msg: string) => void)[] = [];

  // WebRTC PeerJS for online cross-computer multiplayer
  private peer: Peer | null = null;
  private peerConnections: DataConnection[] = [];
  private hostConnection: DataConnection | null = null;
  public connectionStatus: NetworkStatus = 'idle';
  public connectionMessage: string = '';
  private joinRetryInterval: ReturnType<typeof setInterval> | null = null;
  private heartbeatInterval: ReturnType<typeof setInterval> | null = null;
  private botAiStates = new Map<string, { jumpHoldTimer: number; stuckTimer: number; lastX: number; reverseTimer: number }>();

  constructor() {
    this.localPlayerId = 'p_' + Math.random().toString(36).substring(2, 9);
    try {
      this.channel = new BroadcastChannel('toybox_trouble_network_v1');
      this.channel.onmessage = (event) => this.handleNetworkMessage(event.data);
    } catch {
      // Fallback if BroadcastChannel is restricted
    }
  }

  public subscribe(cb: (room: RoomState) => void) {
    this.onStateChangeCallbacks.push(cb);
    if (this.room) cb(this.room);
    return () => {
      this.onStateChangeCallbacks = this.onStateChangeCallbacks.filter((c) => c !== cb);
    };
  }

  public onStatusChange(cb: (status: NetworkStatus, msg: string) => void) {
    this.onStatusCallbacks.push(cb);
    cb(this.connectionStatus, this.connectionMessage);
    return () => {
      this.onStatusCallbacks = this.onStatusCallbacks.filter((c) => c !== cb);
    };
  }

  private notifyStatus(status: NetworkStatus, msg: string) {
    this.connectionStatus = status;
    this.connectionMessage = msg;
    for (const cb of this.onStatusCallbacks) {
      cb(status, msg);
    }
  }

  private notify() {
    if (!this.room) return;
    for (const cb of this.onStateChangeCallbacks) {
      cb(this.room);
    }
  }

  private broadcast(type: string, payload: unknown) {
    const msg = { type, payload, senderId: this.localPlayerId };

    // 1. Same-computer BroadcastChannel
    if (this.channel) {
      try {
        this.channel.postMessage(msg);
      } catch {
        // ignore
      }
    }

    // 2. Cross-computer WebRTC Data Channels
    if (this.isHost()) {
      for (const conn of this.peerConnections) {
        try {
          if (conn.open) conn.send(msg);
        } catch {
          // ignore
        }
      }
    } else if (this.hostConnection && this.hostConnection.open) {
      try {
        this.hostConnection.send(msg);
      } catch {
        // ignore
      }
    }
  }

  private handleNetworkMessage(
    data: { type: string; payload: any; senderId: string },
    senderConn?: DataConnection
  ) {
    if (!data || data.senderId === this.localPlayerId) return;

    switch (data.type) {
      case 'ROOM_STATE_SYNC': {
        // Authoritative update from host
        const targetCode = String(data.payload?.roomCode || '').trim().toUpperCase().replace(/[^0-9A-Z]/g, '');
        const currentCode = this.room ? String(this.room.roomCode).trim().toUpperCase().replace(/[^0-9A-Z]/g, '') : '';
        const isTargetRoom =
          !this.room ||
          !currentCode ||
          targetCode === currentCode ||
          targetCode.replace('TOY', '') === currentCode.replace('TOY', '') ||
          targetCode.endsWith(currentCode.replace('TOY', ''));

        if (data.payload && isTargetRoom && !this.isHost()) {
          const prevLevelId = this.room?.levelId;
          this.room = data.payload;

          // If guest was retrying to join, stop retry timer
          if (this.joinRetryInterval) {
            clearInterval(this.joinRetryInterval);
            this.joinRetryInterval = null;
          }
          this.notifyStatus('connected', 'Connected to room!');

          // Reconcile and synchronize moving hazards to match host's exact timeline
          if (this.room && this.room.hazards) {
            const activeLevel = getWorldById(this.room.levelId);
            for (const synced of this.room.hazards) {
              const localH = activeLevel.movingHazards.find((h) => h.id === synced.id);
              if (localH) {
                const dist = Math.abs(localH.x - synced.x) + Math.abs(localH.y - synced.y);
                // Reconcile if position diverged or if world changed
                if (dist > 8 || prevLevelId !== this.room.levelId) {
                  localH.x = synced.x;
                  localH.y = synced.y;
                  localH.direction = synced.direction;
                }
              }
            }
          }

          // Reconcile and synchronize collapsing platforms to match host's exact timeline
          if (this.room && this.room.platforms) {
            const activeLevel = getWorldById(this.room.levelId);
            for (const syncedP of this.room.platforms) {
              const localP = activeLevel.platforms.find((p) => p.id === syncedP.id);
              if (localP) {
                localP.collapsed = syncedP.collapsed;
                localP.collapseTimer = syncedP.collapseTimer;
                localP.respawnTimer = syncedP.respawnTimer;
              }
            }
          }

          this.notify();
        }
        break;
      }

      case 'PLAYER_JOIN_REQUEST': {
        const payloadCode = String(data.payload?.roomCode || '').trim().toUpperCase().replace(/[^0-9A-Z]/g, '');
        const hostCode = String(this.room?.roomCode || '').trim().toUpperCase().replace(/[^0-9A-Z]/g, '');
        const codesMatch =
          payloadCode === hostCode ||
          payloadCode.replace('TOY', '') === hostCode.replace('TOY', '') ||
          payloadCode.endsWith(hostCode.replace('TOY', '')) ||
          hostCode.endsWith(payloadCode.replace('TOY', ''));

        if (this.isHost() && this.room && codesMatch) {
          const req = data.payload.player as PlayerState;
          const currentCount = Object.keys(this.room.players).length;

          if (this.room.players[req.id]) {
            // Already present: update profile and acknowledge directly
            this.room.players[req.id].name = req.name || this.room.players[req.id].name;
            this.room.players[req.id].characterId = req.characterId || this.room.players[req.id].characterId;
            this.room.players[req.id].isReady = true;
            this.broadcastState();
            this.notify();
            if (senderConn && senderConn.open) {
              senderConn.send({
                type: 'ROOM_STATE_SYNC',
                payload: this.room,
                senderId: this.localPlayerId,
              });
            }
          } else if (currentCount < 6) {
            const activeLevel = getWorldById(this.room.levelId);
            const spawnIdx = currentCount;
            const spawn = activeLevel.spawns[spawnIdx] || activeLevel.spawns[0];
            req.x = spawn.x;
            req.y = spawn.y;
            req.isReady = true;
            this.room.players[req.id] = req;
            this.broadcastState();
            this.notify();
            // Direct immediate acknowledgement to sender
            if (senderConn && senderConn.open) {
              senderConn.send({
                type: 'ROOM_STATE_SYNC',
                payload: this.room,
                senderId: this.localPlayerId,
              });
            }
          } else {
            // Room is full
            if (senderConn && senderConn.open) {
              senderConn.send({
                type: 'ROOM_FULL',
                payload: { message: 'Room is full (max 6 racers)!' },
                senderId: this.localPlayerId,
              });
            }
          }
        }
        break;
      }

      case 'ROOM_FULL': {
        if (this.joinRetryInterval) {
          clearInterval(this.joinRetryInterval);
          this.joinRetryInterval = null;
        }
        this.notifyStatus('full', data.payload?.message || 'Room is at maximum capacity (6 racers)!');
        break;
      }

      case 'PING': {
        if (senderConn && senderConn.open) {
          senderConn.send({ type: 'PONG', senderId: this.localPlayerId });
        }
        break;
      }

      case 'PLAYER_INPUT': {
        if (this.isHost() && this.room && this.room.phase === 'racing') {
          const { playerId, input } = data.payload;
          if (this.room.players[playerId]) {
            // Store input for authoritative step
            (this.room.players[playerId] as any)._pendingInput = input;
          }
        }
        break;
      }

      case 'TRAP_PLACE_REQUEST': {
        if (this.isHost() && this.room && this.room.phase === 'trap_placement') {
          const { trap } = data.payload as { trap: PlacedTrap };
          const activeLevel = getWorldById(this.room.levelId);
          // Accept placement anywhere across the active level without restrictions
          if (
            trap.x >= 0 &&
            trap.x <= activeLevel.width &&
            trap.y >= 0 &&
            trap.y <= activeLevel.height
          ) {
            this.room.traps = this.room.traps.filter((t) => t.ownerId !== trap.ownerId);
            this.room.traps.push(trap);
            this.broadcastState();
            this.notify();
          }
        }
        break;
      }

      case 'READY_TOGGLE': {
        if (this.isHost() && this.room) {
          const { playerId, isReady } = data.payload;
          if (this.room.players[playerId]) {
            this.room.players[playerId].isReady = isReady;
            this.broadcastState();
            this.notify();
          }
        }
        break;
      }

      case 'CHANGE_CHARACTER': {
        if (this.isHost() && this.room) {
          const { playerId, characterId } = data.payload;
          if (this.room.players[playerId]) {
            this.room.players[playerId].characterId = characterId;
            this.broadcastState();
            this.notify();
          }
        }
        break;
      }
    }
  }

  public isHost(): boolean {
    return this.room !== null && this.room.hostId === this.localPlayerId;
  }

  public createRoom(hostName: string, characterId: CharacterId): RoomState {
    // 4-digit code (1000 - 9999) to prevent peer ID collisions on public signaling server
    const code = 'TOY-' + Math.floor(1000 + Math.random() * 9000);
    const spawn = WORLD_TRAINING.spawns[0];

    const hostPlayer: PlayerState = {
      id: this.localPlayerId,
      name: hostName.trim() || 'Player 1',
      characterId,
      colorVariant: 0,
      isHost: true,
      isReady: true,
      isBot: false,
      x: spawn.x,
      y: spawn.y,
      vx: 0,
      vy: 0,
      facing: 1,
      isGrounded: true,
      isJumping: false,
      coyoteTimer: 0,
      jumpBufferTimer: 0,
      animFrame: 0,
      squishX: 1,
      squishY: 1,
      runCycle: 0,
      lastCheckpointId: 0,
      finished: false,
      finishTime: null,
      finishRank: null,
      respawnProtectionTimer: 0,
      isRespawning: false,
      respawnTimer: 0,
      statusEffect: 'none',
      statusTimer: 0,
      roundPoints: [],
      totalScore: 0,
    };

    resetMovingHazards(WORLD_TRAINING);
    resetPlatforms(WORLD_TRAINING);
    this.room = {
      roomCode: code,
      hostId: this.localPlayerId,
      phase: 'lobby',
      currentRound: 1,
      totalRounds: 5,
      countdownTimer: 3,
      trapPhaseTimer: 25,
      worldTransitionTimer: 3.2,
      roundStartTime: 0,
      players: { [this.localPlayerId]: hostPlayer },
      traps: [],
      levelId: WORLD_TRAINING.id,
      worldHistory: [WORLD_TRAINING.id],
      hazards: WORLD_TRAINING.movingHazards.map((h) => ({
        id: h.id,
        x: h.x,
        y: h.y,
        direction: h.direction,
      })),
      platforms: WORLD_TRAINING.platforms
        .filter((p) => p.type === 'collapsing')
        .map((p) => ({
          id: p.id,
          collapsed: false,
        })),
    };

    // Setup WebRTC Host Peer for cross-computer connections
    try {
      if (this.peer) this.peer.destroy();
      const cleanPeerId = 'tt-' + code.toLowerCase().replace(/[^a-z0-9]/g, '');
      this.peer = new Peer(cleanPeerId, PEER_CONFIG);

      this.peer.on('open', () => {
        this.notifyStatus('connected', `Room ${code} active.`);
      });

      this.peer.on('connection', (conn) => {
        // Remove stale connections from the same peer
        this.peerConnections = this.peerConnections.filter((c) => c.peer !== conn.peer && c.open);
        this.peerConnections.push(conn);

        conn.on('data', (data: any) => this.handleNetworkMessage(data, conn));

        const sendState = () => {
          if (this.room && conn.open) {
            try {
              conn.send({
                type: 'ROOM_STATE_SYNC',
                payload: this.room,
                senderId: this.localPlayerId,
              });
            } catch {
              // ignore
            }
          }
        };

        if (conn.open) {
          sendState();
        } else {
          conn.on('open', sendState);
        }

        conn.on('close', () => {
          this.peerConnections = this.peerConnections.filter((c) => c !== conn);
        });

        conn.on('error', () => {
          this.peerConnections = this.peerConnections.filter((c) => c !== conn);
        });
      });

      this.peer.on('error', (err: any) => {
        if (err?.type === 'unavailable-id') {
          // Re-claim or reconnect if peer ID was temporarily held
          setTimeout(() => {
            if (this.isHost() && this.room) {
              try {
                this.peer?.destroy();
                this.peer = new Peer(cleanPeerId, PEER_CONFIG);
              } catch {
                // ignore
              }
            }
          }, 350);
        }
      });
    } catch {
      // Graceful fallback
    }

    // Keepalive heartbeat every 2.5s to maintain UDP NAT mappings across routers for up to 6 players
    if (this.heartbeatInterval) clearInterval(this.heartbeatInterval);
    this.heartbeatInterval = setInterval(() => {
      if (this.isHost() && this.room) {
        this.broadcastState();
      }
    }, 2500);

    this.broadcastState();
    this.notify();
    return this.room;
  }

  public joinRoom(roomCode: string, playerName: string, characterId: CharacterId) {
    let cleanCode = roomCode.trim().toUpperCase().replace(/\s+/g, '-');
    if (!cleanCode) return;
    if (!cleanCode.startsWith('TOY-') && /^[0-9A-Z]{3,6}$/.test(cleanCode)) {
      cleanCode = 'TOY-' + cleanCode;
    }

    if (this.joinRetryInterval) {
      clearInterval(this.joinRetryInterval);
      this.joinRetryInterval = null;
    }

    this.notifyStatus('connecting', `Connecting to room ${cleanCode}...`);

    const newPlayer: PlayerState = {
      id: this.localPlayerId,
      name: playerName.trim() || 'Player 2',
      characterId,
      colorVariant: 0,
      isHost: false,
      isReady: true,
      isBot: false,
      x: 120,
      y: 520,
      vx: 0,
      vy: 0,
      facing: 1,
      isGrounded: true,
      isJumping: false,
      coyoteTimer: 0,
      jumpBufferTimer: 0,
      animFrame: 0,
      squishX: 1,
      squishY: 1,
      runCycle: 0,
      lastCheckpointId: 0,
      finished: false,
      finishTime: null,
      finishRank: null,
      respawnProtectionTimer: 0,
      isRespawning: false,
      respawnTimer: 0,
      statusEffect: 'none',
      statusTimer: 0,
      roundPoints: [],
      totalScore: 0,
    };

    const joinPayload = {
      roomCode: cleanCode,
      player: newPlayer,
    };

    // 1. Same-computer BroadcastChannel
    this.broadcast('PLAYER_JOIN_REQUEST', joinPayload);

    // 2. WebRTC Peer connection across internet / separate computers
    try {
      if (this.peer) this.peer.destroy();
      this.peer = new Peer(PEER_CONFIG);

      this.peer.on('open', () => {
        const targetHostId = 'tt-' + cleanCode.toLowerCase().replace(/[^a-z0-9]/g, '');
        this.notifyStatus('connecting', `Contacting room ${cleanCode}...`);

        const conn = this.peer!.connect(targetHostId, {
          reliable: true,
        });
        this.hostConnection = conn;

        const sendJoin = () => {
          try {
            if (conn.open) {
              conn.send({
                type: 'PLAYER_JOIN_REQUEST',
                payload: joinPayload,
                senderId: this.localPlayerId,
              });
            }
          } catch {
            // will retry in interval
          }
        };

        conn.on('open', () => {
          this.notifyStatus('connecting', `Connected to host! Entering lobby...`);
          sendJoin();
        });

        conn.on('data', (data: any) => this.handleNetworkMessage(data, conn));

        conn.on('close', () => {
          this.notifyStatus('error', 'Disconnected from host.');
        });

        conn.on('error', (err: any) => {
          this.notifyStatus('error', `Connection error: ${err?.message || 'Check room code'}`);
        });

        // Auto-retry handshake until room sync is received & player is in the room
        let attempts = 0;
        this.joinRetryInterval = setInterval(() => {
          attempts++;
          if (this.room && this.room.players[this.localPlayerId]) {
            if (this.joinRetryInterval) clearInterval(this.joinRetryInterval);
            this.joinRetryInterval = null;
            this.notifyStatus('connected', 'Connected!');
            return;
          }

          // Resend join request on both WebRTC and BroadcastChannel
          this.broadcast('PLAYER_JOIN_REQUEST', joinPayload);
          sendJoin();

          if (attempts >= 15) {
            if (this.joinRetryInterval) clearInterval(this.joinRetryInterval);
            this.joinRetryInterval = null;
            this.notifyStatus(
              'error',
              `Could not reach room "${cleanCode}". Make sure the host has the room open!`
            );
          }
        }, 650);
      });

      this.peer.on('error', (err: any) => {
        if (err?.type === 'peer-unavailable') {
          if (this.joinRetryInterval) clearInterval(this.joinRetryInterval);
          this.joinRetryInterval = null;
          this.notifyStatus(
            'error',
            `Room "${cleanCode}" not found. Verify the code with the host!`
          );
        } else {
          this.notifyStatus('error', `Network error: ${err?.type || 'Connection failed'}`);
        }
      });
    } catch {
      this.notifyStatus('error', 'WebRTC initialization failed on this browser.');
    }
  }

  public addBot() {
    if (!this.isHost() || !this.room) return;
    const count = Object.keys(this.room.players).length;
    if (count >= 6) return;

    const botNames = ['Robo-Racer', 'Block-Bot', 'Toy-Titan', 'Pixel-Paws', 'Turbo-Teddy'];
    const botChars: CharacterId[] = ['robot', 'dino', 'dog', 'crayon', 'duck', 'ballerina'];

    const botId = 'bot_' + Math.random().toString(36).substring(2, 7);
    const activeLevel = getWorldById(this.room.levelId);
    const spawn = activeLevel.spawns[count] || activeLevel.spawns[0];
    const charId = botChars[count % botChars.length];

    const botPlayer: PlayerState = {
      id: botId,
      name: botNames[count % botNames.length],
      characterId: charId,
      colorVariant: 1,
      isHost: false,
      isReady: true,
      isBot: true,
      x: spawn.x,
      y: spawn.y,
      vx: 0,
      vy: 0,
      facing: 1,
      isGrounded: true,
      isJumping: false,
      coyoteTimer: 0,
      jumpBufferTimer: 0,
      animFrame: 0,
      squishX: 1,
      squishY: 1,
      runCycle: 0,
      lastCheckpointId: 0,
      finished: false,
      finishTime: null,
      finishRank: null,
      respawnProtectionTimer: 0,
      isRespawning: false,
      respawnTimer: 0,
      statusEffect: 'none',
      statusTimer: 0,
      roundPoints: [],
      totalScore: 0,
    };

    this.room.players[botId] = botPlayer;
    this.broadcastState();
    this.notify();
  }

  public removePlayer(playerId: string) {
    if (!this.isHost() || !this.room) return;
    if (this.room.players[playerId]) {
      delete this.room.players[playerId];
      this.broadcastState();
      this.notify();
    }
  }

  public toggleReady() {
    if (!this.room) return;
    const local = this.room.players[this.localPlayerId];
    if (!local) return;

    const nextReady = !local.isReady;
    local.isReady = nextReady;

    if (this.isHost()) {
      this.broadcastState();
      this.notify();
    } else {
      this.broadcast('READY_TOGGLE', { playerId: this.localPlayerId, isReady: nextReady });
    }
  }

  public changeCharacter(charId: CharacterId) {
    if (!this.room) return;
    const local = this.room.players[this.localPlayerId];
    if (!local) return;

    local.characterId = charId;
    if (this.isHost()) {
      this.broadcastState();
      this.notify();
    } else {
      this.broadcast('CHANGE_CHARACTER', { playerId: this.localPlayerId, characterId: charId });
    }
  }

  public startMatch() {
    if (!this.isHost() || !this.room) return;
    const count = Object.keys(this.room.players).length;
    if (count < 1) return;

    const firstWorld = getWorldForRound(1, []);
    resetMovingHazards(firstWorld);
    resetPlatforms(firstWorld);
    this.room.currentRound = 1;
    this.room.levelId = firstWorld.id;
    this.room.worldHistory = [firstWorld.id];
    this.room.phase = 'world_transition';
    this.room.worldTransitionTimer = 3.5;
    this.room.trapPhaseTimer = 25;
    this.room.traps = [];
    this.room.hazards = firstWorld.movingHazards.map((h) => ({
      id: h.id,
      x: h.x,
      y: h.y,
      direction: h.direction,
    }));
    this.room.platforms = firstWorld.platforms
      .filter((p) => p.type === 'collapsing')
      .map((p) => ({
        id: p.id,
        collapsed: false,
      }));
    this.resetPlayersForRound(firstWorld);
    this.broadcastState();
    this.notify();
  }

  public placeTrap(x: number, y: number, type: TrapType, anchorId?: string) {
    if (!this.room) return;
    const local = this.room.players[this.localPlayerId];
    if (!local) return;

    const trapWidth = type === 'slime' ? 52 : type === 'spring' ? 48 : 50;
    const trapHeight = type === 'slime' ? 16 : 18;

    const trap: PlacedTrap = {
      id: 'trap_' + Math.random().toString(36).substring(2, 7),
      anchorId: anchorId || 'custom_' + Math.random().toString(36).substring(2, 6),
      type,
      ownerId: this.localPlayerId,
      ownerName: local.name,
      x: Math.round(x),
      y: Math.round(y),
      width: trapWidth,
      height: trapHeight,
      revealed: false,
      triggered: false,
      triggerCooldown: 0,
    };

    if (this.isHost()) {
      this.room.traps = this.room.traps.filter((t) => t.ownerId !== this.localPlayerId);
      this.room.traps.push(trap);
      this.broadcastState();
      this.notify();
    } else {
      this.broadcast('TRAP_PLACE_REQUEST', { trap });
    }
  }

  public sendInput(input: PlayerInput) {
    if (!this.room) return;
    if (this.isHost()) {
      (this.room.players[this.localPlayerId] as any)._pendingInput = input;
    } else {
      this.broadcast('PLAYER_INPUT', { playerId: this.localPlayerId, input });
    }
  }

  /**
   * Host simulation tick
   */
  public updateHost(dt: number, currentTime: number, localInput: PlayerInput) {
    if (!this.isHost() || !this.room) return;
    const activeLevel = getWorldById(this.room.levelId);

    // Authoritative host simulation for world moving hazards and collapsing platforms
    updateMovingHazards(activeLevel, dt);
    updateCollapsingPlatforms(activeLevel, dt);

    // Synchronize moving hazard positions into room state for all remote players
    this.room.hazards = activeLevel.movingHazards.map((h) => ({
      id: h.id,
      x: Math.round(h.x * 10) / 10,
      y: Math.round(h.y * 10) / 10,
      direction: h.direction,
    }));

    // Synchronize collapsing platform states (shaking, collapsed, timers) into room state
    this.room.platforms = activeLevel.platforms
      .filter((p) => p.type === 'collapsing')
      .map((p) => ({
        id: p.id,
        collapsed: !!p.collapsed,
        collapseTimer: p.collapseTimer !== undefined ? Math.round(p.collapseTimer * 100) / 100 : undefined,
        respawnTimer: p.respawnTimer !== undefined ? Math.round(p.respawnTimer * 100) / 100 : undefined,
      }));

    // World Transition Card Display
    if (this.room.phase === 'world_transition') {
      const remaining = (this.room.worldTransitionTimer ?? 3.5) - dt;
      this.room.worldTransitionTimer = remaining;

      if (remaining <= 0) {
        this.room.phase = 'trap_placement';
        this.room.trapPhaseTimer = 25;
      }
      this.broadcastState();
      this.notify();
      return;
    }

    if (this.room.phase === 'trap_placement') {
      this.room.trapPhaseTimer -= dt;

      // Bot trap placement logic: place anywhere on available platforms
      for (const p of Object.values(this.room.players)) {
        if (p.isBot && !this.room.traps.some((t) => t.ownerId === p.id)) {
          const validPlatforms = activeLevel.platforms.filter(
            (pl) => pl.type === 'solid' || pl.type === 'shelf' || pl.type === 'ice'
          );
          if (validPlatforms.length > 0) {
            const plat = validPlatforms[Math.floor(Math.random() * validPlatforms.length)];
            const types: TrapType[] = [
              'spring',
              'slime',
              'fake_floor',
              'chomp_toy',
              'bubble_blower',
              'banana_peel',
            ];
            const trapType = types[Math.floor(Math.random() * types.length)];
            const tw =
              trapType === 'slime'
                ? 52
                : trapType === 'spring'
                ? 48
                : trapType === 'chomp_toy'
                ? 44
                : trapType === 'bubble_blower'
                ? 42
                : trapType === 'banana_peel'
                ? 40
                : 50;
            const th = trapType === 'slime' ? 16 : trapType === 'bubble_blower' ? 22 : 18;
            const posX = Math.max(
              plat.x + 10,
              Math.min(plat.x + plat.width - tw - 10, plat.x + Math.random() * (plat.width - tw))
            );
            const posY = plat.y - th + 2;

            this.room.traps.push({
              id: 'bot_trap_' + Math.random().toString(36).substring(2, 6),
              anchorId: 'bot_' + Math.random().toString(36).substring(2, 6),
              type: trapType,
              ownerId: p.id,
              ownerName: p.name,
              x: Math.round(posX),
              y: Math.round(posY),
              width: tw,
              height: th,
              revealed: false,
              triggered: false,
              triggerCooldown: 0,
            });
          }
        }
      }

      if (this.room.trapPhaseTimer <= 0) {
        this.room.phase = 'countdown';
        this.room.countdownTimer = 3.5;
        // Reveal traps
        for (const t of this.room.traps) {
          t.revealed = true;
        }
      }
      this.broadcastState();
      this.notify();
      return;
    }

    if (this.room.phase === 'countdown') {
      this.room.countdownTimer -= dt;
      if (this.room.countdownTimer <= 0) {
        this.room.phase = 'racing';
        this.room.roundStartTime = currentTime;
      }
      this.broadcastState();
      this.notify();
      return;
    }

    if (this.room.phase === 'racing') {
      // Step all players
      let allFinished = true;
      let finishersCount = Object.values(this.room.players).filter((p) => p.finished).length;

      for (const p of Object.values(this.room.players)) {
        let input: PlayerInput = { left: false, right: false, jump: false, jumpPressed: false };

        if (p.id === this.localPlayerId) {
          input = localInput;
        } else if (p.isBot) {
          input = this.computeBotInput(p, dt, activeLevel);
        } else if ((p as any)._pendingInput) {
          input = (p as any)._pendingInput;
        }

        updatePlayerPhysics(
          p,
          input,
          activeLevel,
          this.room.traps,
          dt,
          currentTime,
          (finishedPlayer) => {
            finishersCount++;
            finishedPlayer.finishRank = finishersCount;
            const pts = ROUND_POINTS[finishersCount - 1] || 1;
            finishedPlayer.roundPoints.push(pts);
            finishedPlayer.totalScore += pts;
          }
        );

        if (!p.finished) {
          allFinished = false;
        }
      }

      // Check if race ended (all finished or time limit reached)
      if (allFinished && finishersCount > 0) {
        this.room.phase = 'round_results';
      }

      this.broadcastState();
      this.notify();
    }
  }

  private computeBotInput(p: PlayerState, dt: number, level: LevelData): PlayerInput {
    const input: PlayerInput = { left: false, right: true, jump: false, jumpPressed: false };

    // Get or initialize AI tracking state
    let ai = this.botAiStates.get(p.id);
    if (!ai) {
      ai = { jumpHoldTimer: 0, stuckTimer: 0, lastX: p.x, reverseTimer: 0 };
      this.botAiStates.set(p.id, ai);
    }

    // 1. Stuck detection & Failsafe Recovery
    const moveDist = Math.abs(p.x - ai.lastX);
    ai.lastX = p.x;
    if (moveDist < 0.8) {
      ai.stuckTimer += dt;
    } else {
      ai.stuckTimer = Math.max(0, ai.stuckTimer - dt * 2);
    }

    // Failsafe: If stuck for over 2.4s, teleport bot to last checkpoint so it never stalls match
    if (ai.stuckTimer > 2.4) {
      const currentCp =
        level.checkpoints.find((cp) => cp.id === p.lastCheckpointId) || level.checkpoints[0];
      p.x = currentCp.respawnX;
      p.y = currentCp.respawnY;
      p.vx = 0;
      p.vy = 0;
      ai.stuckTimer = 0;
      ai.jumpHoldTimer = 0;
      ai.reverseTimer = 0;
      return { left: false, right: true, jump: false, jumpPressed: false };
    }

    // Unstuck maneuver: if stuck for > 0.35s, back up briefly to get a running start
    if (ai.stuckTimer > 0.35 && ai.reverseTimer <= 0) {
      ai.reverseTimer = 0.22;
    }

    if (ai.reverseTimer > 0) {
      ai.reverseTimer -= dt;
      input.left = true;
      input.right = false;
      return input;
    }

    // 2. Obstacle & Gap Perception
    const lookAheadNearX = p.x + 36;
    const lookAheadMidX = p.x + 75;
    const footY = p.y;

    // Check if there is an oncoming solid wall / platform ledge ahead
    const wallAhead = level.platforms.some((plat) => {
      if (plat.collapsed) return false;
      const inX = plat.x >= p.x + 8 && plat.x <= p.x + 85;
      const inY = plat.y < footY && plat.y > footY - 110;
      return inX && inY;
    });

    // Check if the current ground ends ahead (gap / pit detection)
    const hasGroundNear = level.platforms.some((plat) => {
      if (plat.collapsed) return false;
      return (
        lookAheadNearX >= plat.x &&
        lookAheadNearX <= plat.x + plat.width &&
        plat.y >= footY - 10 &&
        plat.y <= footY + 45
      );
    });

    const hasGroundMid = level.platforms.some((plat) => {
      if (plat.collapsed) return false;
      return (
        lookAheadMidX >= plat.x &&
        lookAheadMidX <= plat.x + plat.width &&
        plat.y >= footY - 10 &&
        plat.y <= footY + 50
      );
    });

    // Check if an upcoming bounce pad can be jumped onto
    const bouncePadAhead = level.platforms.some(
      (plat) => plat.type === 'bounce' && p.x + 15 < plat.x + plat.width && p.x + 85 > plat.x
    );

    // Check moving hazards
    const hazardNear = level.movingHazards.some(
      (h) => h.x > p.x && h.x < p.x + 100 && Math.abs(h.y - p.y) < 65
    );

    // 3. Jump Trigger Conditions: use coyoteTimer so bots don't fail edge leaps!
    const canJump = p.isGrounded || p.coyoteTimer > 0;
    const shouldJump =
      canJump &&
      ai.jumpHoldTimer <= 0 &&
      (wallAhead ||
        (!hasGroundNear && p.x > 300) ||
        (!hasGroundMid && p.x > 300) ||
        hazardNear ||
        bouncePadAhead ||
        ai.stuckTimer > 0.15 ||
        Math.random() < 0.005);

    if (shouldJump) {
      ai.jumpHoldTimer = 0.34;
      ai.stuckTimer = 0;
      input.jump = true;
      input.jumpPressed = true;
    } else if (ai.jumpHoldTimer > 0) {
      ai.jumpHoldTimer -= dt;
      input.jump = true;
    }

    return input;
  }

  public nextRound() {
    if (!this.isHost() || !this.room) return;

    if (this.room.currentRound >= this.room.totalRounds) {
      this.room.phase = 'match_victory';
    } else {
      this.room.currentRound++;
      const nextWorld = getWorldForRound(this.room.currentRound, this.room.worldHistory || []);
      this.room.levelId = nextWorld.id;
      if (!this.room.worldHistory) this.room.worldHistory = [];
      this.room.worldHistory.push(nextWorld.id);

      this.room.phase = 'world_transition';
      this.room.worldTransitionTimer = 3.5;
      this.room.trapPhaseTimer = 25;
      this.room.traps = [];
      resetMovingHazards(nextWorld);
      resetPlatforms(nextWorld);
      this.room.hazards = nextWorld.movingHazards.map((h) => ({
        id: h.id,
        x: h.x,
        y: h.y,
        direction: h.direction,
      }));
      this.room.platforms = nextWorld.platforms
        .filter((p) => p.type === 'collapsing')
        .map((p) => ({
          id: p.id,
          collapsed: false,
        }));
      this.resetPlayersForRound(nextWorld);
    }

    this.broadcastState();
    this.notify();
  }

  public skipTrapPhase() {
    if (!this.isHost() || !this.room) return;
    if (this.room.phase === 'trap_placement') {
      this.room.trapPhaseTimer = 0.2;
      this.broadcastState();
      this.notify();
    }
  }

  public rematch() {
    if (!this.isHost() || !this.room) return;

    const firstWorld = getWorldForRound(1, []);
    resetMovingHazards(firstWorld);
    resetPlatforms(firstWorld);
    this.room.currentRound = 1;
    this.room.levelId = firstWorld.id;
    this.room.worldHistory = [firstWorld.id];
    this.room.phase = 'world_transition';
    this.room.worldTransitionTimer = 3.5;
    this.room.trapPhaseTimer = 25;
    this.room.traps = [];
    this.room.hazards = firstWorld.movingHazards.map((h) => ({
      id: h.id,
      x: h.x,
      y: h.y,
      direction: h.direction,
    }));
    this.room.platforms = firstWorld.platforms
      .filter((p) => p.type === 'collapsing')
      .map((p) => ({
        id: p.id,
        collapsed: false,
      }));

    for (const p of Object.values(this.room.players)) {
      p.roundPoints = [];
      p.totalScore = 0;
    }

    this.resetPlayersForRound(firstWorld);
    this.broadcastState();
    this.notify();
  }

  private resetPlayersForRound(targetLevel?: LevelData) {
    if (!this.room) return;
    const activeLevel = targetLevel || getWorldById(this.room.levelId);
    const playersList = Object.values(this.room.players);
    playersList.forEach((p, idx) => {
      const spawn = activeLevel.spawns[idx] || activeLevel.spawns[0];
      p.x = spawn.x;
      p.y = spawn.y;
      p.vx = 0;
      p.vy = 0;
      p.facing = 1;
      p.isGrounded = true;
      p.isJumping = false;
      p.lastCheckpointId = 0;
      p.finished = false;
      p.finishTime = null;
      p.finishRank = null;
      p.statusEffect = 'none';
      p.statusTimer = 0;
      p.respawnProtectionTimer = 0;
      p.squishX = 1;
      p.squishY = 1;
    });
  }

  private broadcastState() {
    if (this.room) {
      this.broadcast('ROOM_STATE_SYNC', this.room);
    }
  }
}

export const network = new NetworkManager();

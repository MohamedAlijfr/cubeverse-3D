/**
 * Real-time WebSocket Client for Multiplayer Rooms and Ghost Duels.
 */

export interface RemotePlayer {
  id: string;
  name: string;
  isHost: boolean;
  ready: boolean;
  moves: number;
  time: number;
  finished: boolean;
  position?: { x: number; z: number; orientation: string };
}

export interface RoomState {
  code: string;
  levelId: number;
  status: 'LOBBY' | 'RACING' | 'FINISHED';
  winnerId?: string;
  players: RemotePlayer[];
}

type EventCallback<T = any> = (data: T) => void;

class MultiplayerClient {
  private ws: WebSocket | null = null;
  public myId: string | null = null;
  public roomState: RoomState | null = null;
  private listeners: Map<string, Set<EventCallback>> = new Map();
  private isConnecting: boolean = false;

  constructor() {
    // Lazy connect on room action
  }

  private connect(): Promise<void> {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      return Promise.resolve();
    }

    if (this.isConnecting) {
      return new Promise((resolve) => {
        const check = setInterval(() => {
          if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            clearInterval(check);
            resolve();
          }
        }, 50);
      });
    }

    this.isConnecting = true;

    return new Promise((resolve, reject) => {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws`;

      try {
        this.ws = new WebSocket(wsUrl);

        this.ws.onopen = () => {
          this.isConnecting = false;
          resolve();
        };

        this.ws.onerror = (err) => {
          this.isConnecting = false;
          this.emit('error', { message: 'Impossible de se connecter au serveur.' });
          reject(err);
        };

        this.ws.onclose = () => {
          this.isConnecting = false;
          this.ws = null;
          this.emit('disconnected', {});
        };

        this.ws.onmessage = (event) => {
          try {
            const { type, data } = JSON.parse(event.data);
            if (type === 'room:joined') {
              this.myId = data.yourId;
              this.roomState = data.room;
              this.emit('room:joined', data);
              this.emit('room:updated', data.room);
            } else if (type === 'room:updated') {
              this.roomState = data.room;
              this.emit('room:updated', data.room);
            } else if (type === 'race:started') {
              this.roomState = data.room;
              this.emit('race:started', data);
            } else if (type === 'opponent:moved') {
              this.emit('opponent:moved', data);
            } else if (type === 'player:finished') {
              this.roomState = data.room;
              this.emit('player:finished', data);
            } else if (type === 'room:reaction') {
              this.emit('room:reaction', data);
            } else if (type === 'error') {
              this.emit('error', data);
            }
          } catch (e) {
            console.error('Failed to parse WebSocket message:', e);
          }
        };
      } catch (err) {
        this.isConnecting = false;
        reject(err);
      }
    });
  }

  public async createRoom(playerName: string, levelId: number = 1) {
    await this.connect();
    this.send('room:create', { playerName, levelId });
  }

  public async joinRoom(roomCode: string, playerName: string) {
    await this.connect();
    this.send('room:join', { roomCode, playerName });
  }

  public toggleReady(ready: boolean) {
    this.send('player:ready', { ready });
  }

  public changeLevel(levelId: number) {
    this.send('room:setLevel', { levelId });
  }

  public startRace() {
    this.send('race:start', {});
  }

  public sendMove(moves: number, position: { x: number; z: number; orientation: string }) {
    this.send('player:move', { moves, position });
  }

  public sendFinish(moves: number, time: number) {
    this.send('player:finish', { moves, time });
  }

  public sendReaction(emoji: string) {
    this.send('room:reaction', { emoji });
  }

  public leaveRoom() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.myId = null;
    this.roomState = null;
  }

  private send(type: string, data: object) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type, data }));
    }
  }

  public on(event: string, callback: EventCallback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
    return () => this.off(event, callback);
  }

  public off(event: string, callback: EventCallback) {
    this.listeners.get(event)?.delete(callback);
  }

  private emit(event: string, data: any) {
    this.listeners.get(event)?.forEach((cb) => cb(data));
  }
}

export const mpClient = new MultiplayerClient();

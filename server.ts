/**
 * Full-stack Express + WebSocket Server for Cubiverse 3D.
 * Manages real-time rooms, player presence, speedrun duel synchronization,
 * and live ghost block tracking.
 */

import express from 'express';
import { createServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface Player {
  id: string;
  name: string;
  isHost: boolean;
  ready: boolean;
  moves: number;
  time: number;
  finished: boolean;
  position?: { x: number; z: number; orientation: string };
  ws: WebSocket;
}

interface Room {
  code: string;
  levelId: number;
  status: 'LOBBY' | 'RACING' | 'FINISHED';
  players: Map<string, Player>;
  winnerId?: string;
  createdAt: number;
}

const rooms = new Map<string, Room>();

function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 5; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

function broadcastToRoom(room: Room, message: object, excludePlayerId?: string) {
  const payload = JSON.stringify(message);
  room.players.forEach((player) => {
    if (player.id !== excludePlayerId && player.ws.readyState === WebSocket.OPEN) {
      player.ws.send(payload);
    }
  });
}

function getSanitizedRoomData(room: Room) {
  const playersList = Array.from(room.players.values()).map((p) => ({
    id: p.id,
    name: p.name,
    isHost: p.isHost,
    ready: p.ready,
    moves: p.moves,
    time: p.time,
    finished: p.finished,
    position: p.position,
  }));

  return {
    code: room.code,
    levelId: room.levelId,
    status: room.status,
    winnerId: room.winnerId,
    players: playersList,
  };
}

async function start() {
  const app = express();
  app.use(express.json());

  const server = createServer(app);
  const wss = new WebSocketServer({ server, path: '/ws' });

  // WebSocket Connection Handler
  wss.on('connection', (ws) => {
    let currentRoomCode: string | null = null;
    let currentPlayerId: string | null = null;

    ws.on('message', (raw) => {
      try {
        const msg = JSON.parse(raw.toString());
        const { type, data } = msg;

        // 1. Create a new room
        if (type === 'room:create') {
          const roomCode = generateRoomCode();
          const playerId = `p_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
          const hostPlayer: Player = {
            id: playerId,
            name: (data?.playerName || 'Explorateur').slice(0, 16),
            isHost: true,
            ready: true,
            moves: 0,
            time: 0,
            finished: false,
            ws,
          };

          const room: Room = {
            code: roomCode,
            levelId: data?.levelId || 1,
            status: 'LOBBY',
            players: new Map([[playerId, hostPlayer]]),
            createdAt: Date.now(),
          };

          rooms.set(roomCode, room);
          currentRoomCode = roomCode;
          currentPlayerId = playerId;

          ws.send(
            JSON.stringify({
              type: 'room:joined',
              data: {
                room: getSanitizedRoomData(room),
                yourId: playerId,
              },
            })
          );
        }

        // 2. Join existing room
        else if (type === 'room:join') {
          const roomCode = (data?.roomCode || '').toUpperCase().trim();
          const room = rooms.get(roomCode);

          if (!room) {
            ws.send(
              JSON.stringify({
                type: 'error',
                data: { message: 'Salon introuvable. Vérifiez le code.' },
              })
            );
            return;
          }

          if (room.players.size >= 6) {
            ws.send(
              JSON.stringify({
                type: 'error',
                data: { message: 'Ce salon est plein (maximum 6 joueurs).' },
              })
            );
            return;
          }

          const playerId = `p_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
          const newPlayer: Player = {
            id: playerId,
            name: (data?.playerName || `Ami ${room.players.size + 1}`).slice(0, 16),
            isHost: false,
            ready: false,
            moves: 0,
            time: 0,
            finished: false,
            ws,
          };

          room.players.set(playerId, newPlayer);
          currentRoomCode = roomCode;
          currentPlayerId = playerId;

          // Notify joining player
          ws.send(
            JSON.stringify({
              type: 'room:joined',
              data: {
                room: getSanitizedRoomData(room),
                yourId: playerId,
              },
            })
          );

          // Broadcast updated room state to all in room
          broadcastToRoom(room, {
            type: 'room:updated',
            data: { room: getSanitizedRoomData(room) },
          });
        }

        // 3. Toggle ready state
        else if (type === 'player:ready' && currentRoomCode && currentPlayerId) {
          const room = rooms.get(currentRoomCode);
          if (!room) return;
          const player = room.players.get(currentPlayerId);
          if (!player) return;

          player.ready = !!data?.ready;
          broadcastToRoom(room, {
            type: 'room:updated',
            data: { room: getSanitizedRoomData(room) },
          });
        }

        // 4. Change level (Host only)
        else if (type === 'room:setLevel' && currentRoomCode && currentPlayerId) {
          const room = rooms.get(currentRoomCode);
          if (!room) return;
          const player = room.players.get(currentPlayerId);
          if (!player?.isHost) return;

          room.levelId = Number(data?.levelId) || 1;
          broadcastToRoom(room, {
            type: 'room:updated',
            data: { room: getSanitizedRoomData(room) },
          });
        }

        // 5. Start race (Host only)
        else if (type === 'race:start' && currentRoomCode && currentPlayerId) {
          const room = rooms.get(currentRoomCode);
          if (!room) return;
          const player = room.players.get(currentPlayerId);
          if (!player?.isHost) return;

          room.status = 'RACING';
          room.winnerId = undefined;
          room.players.forEach((p) => {
            p.moves = 0;
            p.time = 0;
            p.finished = false;
            p.position = undefined;
          });

          broadcastToRoom(room, {
            type: 'race:started',
            data: {
              room: getSanitizedRoomData(room),
              levelId: room.levelId,
              timestamp: Date.now(),
            },
          });
        }

        // 6. Player move / progress update (live ghost tracking)
        else if (type === 'player:move' && currentRoomCode && currentPlayerId) {
          const room = rooms.get(currentRoomCode);
          if (!room || room.status !== 'RACING') return;
          const player = room.players.get(currentPlayerId);
          if (!player) return;

          player.moves = data?.moves ?? player.moves;
          player.position = data?.position;

          // Broadcast to opponents
          broadcastToRoom(
            room,
            {
              type: 'opponent:moved',
              data: {
                playerId: player.id,
                playerName: player.name,
                moves: player.moves,
                position: player.position,
              },
            },
            player.id
          );
        }

        // 7. Player finished / won
        else if (type === 'player:finish' && currentRoomCode && currentPlayerId) {
          const room = rooms.get(currentRoomCode);
          if (!room || room.status !== 'RACING') return;
          const player = room.players.get(currentPlayerId);
          if (!player) return;

          player.finished = true;
          player.moves = data?.moves ?? player.moves;
          player.time = data?.time ?? 0;

          if (!room.winnerId) {
            room.winnerId = player.id;
          }

          const allFinished = Array.from(room.players.values()).every((p) => p.finished);
          if (allFinished) {
            room.status = 'FINISHED';
          }

          broadcastToRoom(room, {
            type: 'player:finished',
            data: {
              room: getSanitizedRoomData(room),
              winnerId: room.winnerId,
              finisherId: player.id,
              finisherName: player.name,
              moves: player.moves,
              time: player.time,
            },
          });
        }

        // 8. Emoji reaction
        else if (type === 'room:reaction' && currentRoomCode && currentPlayerId) {
          const room = rooms.get(currentRoomCode);
          if (!room) return;
          const player = room.players.get(currentPlayerId);
          if (!player) return;

          broadcastToRoom(room, {
            type: 'room:reaction',
            data: {
              playerId: player.id,
              playerName: player.name,
              emoji: data?.emoji || '👏',
            },
          });
        }
      } catch (err) {
        console.error('WebSocket message error:', err);
      }
    });

    ws.on('close', () => {
      if (currentRoomCode && currentPlayerId) {
        const room = rooms.get(currentRoomCode);
        if (room) {
          room.players.delete(currentPlayerId);

          if (room.players.size === 0) {
            rooms.delete(currentRoomCode);
          } else {
            // If host left, designate first player as new host
            const remaining = Array.from(room.players.values());
            if (!remaining.some((p) => p.isHost)) {
              remaining[0].isHost = true;
            }

            broadcastToRoom(room, {
              type: 'player:left',
              data: {
                room: getSanitizedRoomData(room),
                playerId: currentPlayerId,
              },
            });
          }
        }
      }
    });
  });

  // REST health check & room info
  app.get('/api/room/:code', (req, res) => {
    const code = req.params.code.toUpperCase();
    const room = rooms.get(code);
    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }
    res.json(getSanitizedRoomData(room));
  });

  // Vite middleware in dev or static files in production
  const isProd = process.env.NODE_ENV === 'production';
  const port = parseInt(process.env.PORT || '3000', 10);

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  server.listen(port, '0.0.0.0', () => {
    console.log(`Cubiverse 3D server running on http://localhost:${port}`);
  });
}

start().catch((err) => {
  console.error('Failed to start server:', err);
});

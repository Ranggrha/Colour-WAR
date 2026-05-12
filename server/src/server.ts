import { Hono } from "hono";
import { cors } from "hono/cors";

// ─── Types ────────────────────────────────────────────────────────────────────

const ALL_COLORS = ["MERAH", "HIJAU", "BIRU", "KUNING", "UNGU", "ORANYE", "MERAH_MUDA", "TOSCA"] as const;
type ColorName = (typeof ALL_COLORS)[number];
type ColorMode = "klasik" | "menengah" | "sulit";

const COLOR_POOLS: Record<ColorMode, ColorName[]> = {
  klasik: ["MERAH", "HIJAU", "BIRU", "KUNING"],
  menengah: ["MERAH", "HIJAU", "BIRU", "KUNING", "UNGU", "ORANYE"],
  sulit: ["MERAH", "HIJAU", "BIRU", "KUNING", "UNGU", "ORANYE", "MERAH_MUDA", "TOSCA"],
};

interface Question {
  word: ColorName;
  color: ColorName;     // jawaban benar = warna font
  choices: ColorName[]; // 4 pilihan termasuk jawaban benar (sudah diacak)
  index: number;
}

interface Player {
  id: string;
  username: string;
  score: number;
  isHost: boolean;
  answeredCount: number;
  ws: import("bun").ServerWebSocket<WSData>;
}

interface Room {
  id: string;
  hostId: string;
  hostName: string;
  players: Map<string, Player>;
  status: "waiting" | "playing" | "finished";
  duration: number;
  colorMode: ColorMode;
  questions: Question[];
  startedAt?: number;
  gameTimer?: ReturnType<typeof setTimeout>;
  maxPlayers: number;
}

interface WSData {
  playerId: string;
  roomId: string;
}

// ─── State ────────────────────────────────────────────────────────────────────

const rooms = new Map<string, Room>();
const playerRoomMap = new Map<string, string>();

// ─── Utility ─────────────────────────────────────────────────────────────────

function generateRoomId(): string {
  let id = Math.random().toString(36).substring(2, 7).toUpperCase();
  while (rooms.has(id)) id = Math.random().toString(36).substring(2, 7).toUpperCase();
  return id;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Generate 4 unique choices (always includes correctColor) from the pool */
function generateChoices(pool: ColorName[], correctColor: ColorName): ColorName[] {
  const others = pool.filter((c) => c !== correctColor);
  const shuffledOthers = shuffle(others).slice(0, 3);
  return shuffle([correctColor, ...shuffledOthers]);
}

function generateQuestions(count: number, colorMode: ColorMode): Question[] {
  const pool = COLOR_POOLS[colorMode];
  const questions: Question[] = [];
  for (let i = 0; i < count; i++) {
    const word = pool[Math.floor(Math.random() * pool.length)];
    let color: ColorName;
    do {
      color = pool[Math.floor(Math.random() * pool.length)];
    } while (color === word && Math.random() > 0.2);
    const choices = generateChoices(pool, color);
    questions.push({ word, color, choices, index: i });
  }
  return questions;
}

function roomToPublic(room: Room) {
  return {
    id: room.id,
    hostId: room.hostId,
    hostName: room.hostName,
    status: room.status,
    duration: room.duration,
    maxPlayers: room.maxPlayers,
    colorMode: room.colorMode,
    playerCount: room.players.size,
    players: Array.from(room.players.values()).map((p) => ({
      id: p.id, username: p.username, score: p.score, isHost: p.isHost, answeredCount: p.answeredCount,
    })),
  };
}

function broadcast(room: Room, message: unknown, excludeId?: string) {
  const data = JSON.stringify(message);
  for (const [id, player] of room.players) {
    if (id !== excludeId) { try { player.ws.send(data); } catch { /* ignore */ } }
  }
}

function sendTo(ws: import("bun").ServerWebSocket<WSData>, message: unknown) {
  try { ws.send(JSON.stringify(message)); } catch { /* ignore */ }
}

function endGame(room: Room) {
  clearTimeout(room.gameTimer);
  room.status = "finished";
  const results = Array.from(room.players.values())
    .map((p) => ({ id: p.id, username: p.username, score: p.score, answeredCount: p.answeredCount }))
    .sort((a, b) => b.score - a.score);
  broadcast(room, { type: "game_over", results });
  setTimeout(() => { rooms.delete(room.id); }, 60_000);
}

function removePlayer(playerId: string) {
  const roomId = playerRoomMap.get(playerId);
  if (!roomId) return;
  playerRoomMap.delete(playerId);

  const room = rooms.get(roomId);
  if (!room) return;

  room.players.delete(playerId);

  if (room.players.size === 0) {
    clearTimeout(room.gameTimer);
    rooms.delete(roomId);
    return;
  }

  if (room.hostId === playerId) {
    const newHost = room.players.values().next().value!;
    newHost.isHost = true;
    room.hostId = newHost.id;
    room.hostName = newHost.username;
  }

  if (room.status === "playing" && room.players.size < 2) {
    endGame(room);
    return;
  }

  broadcast(room, { type: "room_update", room: roomToPublic(room) });
}

// ─── Hono HTTP ────────────────────────────────────────────────────────────────

const ALLOWED_ORIGINS = [
  'https://colour-war.vercel.app',
  'http://localhost:5173',
  'http://localhost:4173',
];

function isAllowedOrigin(origin: string | null): boolean {
  if (!origin) return true;
  if (ALLOWED_ORIGINS.includes(origin)) return true;
  // Allow all Vercel preview deployments for this project
  if (origin.match(/^https:\/\/colour-war[\w-]*\.vercel\.app$/)) return true;
  return false;
}

const app = new Hono();
app.use('*', cors({
  origin: (origin) => isAllowedOrigin(origin) ? origin : '',
  allowMethods: ['GET', 'POST', 'OPTIONS'],
  allowHeaders: ['Content-Type'],
  credentials: true,
}))

app.get("/api/rooms", (c) => {
  const publicRooms = Array.from(rooms.values())
    .filter((r) => r.status === "waiting" && r.players.size < r.maxPlayers)
    .map(roomToPublic);
  return c.json({ rooms: publicRooms });
});

app.get("/", (c) => c.json({ status: "ok", uptime: process.uptime() }));

// ─── Bun Native WebSocket ─────────────────────────────────────────────────────

const wsHandler: import("bun").WebSocketHandler<WSData> = {
  open(ws) {
    const playerId = crypto.randomUUID();
    ws.data = { playerId, roomId: "" };
    sendTo(ws, { type: "connected", playerId });
  },

  message(ws, rawMsg) {
    let msg: { type: string;[key: string]: unknown };
    try {
      msg = JSON.parse(typeof rawMsg === "string" ? rawMsg : rawMsg.toString());
    } catch { return; }

    const { playerId } = ws.data;

    // ── CREATE ROOM ────────────────────────────────────────────────────────────
    if (msg.type === "create_room") {
      const username = String(msg.username || "Guest");
      const duration = Number(msg.duration) || 30;
      const colorMode: ColorMode = (["klasik", "menengah", "sulit"].includes(String(msg.colorMode))
        ? msg.colorMode : "klasik") as ColorMode;
      const roomId = generateRoomId();

      const player: Player = { id: playerId, username, score: 0, isHost: true, answeredCount: 0, ws };
      const room: Room = {
        id: roomId, hostId: playerId, hostName: username,
        players: new Map([[playerId, player]]),
        status: "waiting", duration, colorMode, questions: [], maxPlayers: 4,
      };

      rooms.set(roomId, room);
      ws.data.roomId = roomId;
      playerRoomMap.set(playerId, roomId);
      sendTo(ws, { type: "room_joined", room: roomToPublic(room), playerId });
      return;
    }

    // ── JOIN ROOM ──────────────────────────────────────────────────────────────
    if (msg.type === "join_room") {
      const targetRoomId = String(msg.roomId || "");
      const username = String(msg.username || "Guest");
      const room = rooms.get(targetRoomId);

      if (!room) { sendTo(ws, { type: "error", message: "Room tidak ditemukan." }); return; }
      if (room.status !== "waiting") { sendTo(ws, { type: "error", message: "Game sudah dimulai." }); return; }
      if (room.players.size >= room.maxPlayers) { sendTo(ws, { type: "error", message: "Room sudah penuh." }); return; }

      const player: Player = { id: playerId, username, score: 0, isHost: false, answeredCount: 0, ws };
      room.players.set(playerId, player);
      ws.data.roomId = targetRoomId;
      playerRoomMap.set(playerId, targetRoomId);

      sendTo(ws, { type: "room_joined", room: roomToPublic(room), playerId });
      broadcast(room, { type: "room_update", room: roomToPublic(room) }, playerId);
      return;
    }

    // ── START GAME ─────────────────────────────────────────────────────────────
    if (msg.type === "start_game") {
      const room = rooms.get(ws.data.roomId);
      if (!room) return;

      if (room.hostId !== playerId) {
        sendTo(ws, { type: "error", message: "Hanya host yang bisa memulai game." });
        return;
      }
      if (room.players.size < 2) {
        sendTo(ws, { type: "error", message: "Minimal 2 pemain untuk memulai." });
        return;
      }

      room.status = "playing";
      room.questions = generateQuestions(80, room.colorMode);

      const COUNTDOWN_MS = 3500;
      room.startedAt = Date.now() + COUNTDOWN_MS;

      for (const p of room.players.values()) {
        p.score = 0;
        p.answeredCount = 0;
      }

      broadcast(room, {
        type: "game_started",
        questions: room.questions,
        duration: room.duration,
        startedAt: room.startedAt,
      });

      room.gameTimer = setTimeout(() => {
        if (rooms.has(room.id) && room.status === "playing") endGame(room);
      }, COUNTDOWN_MS + room.duration * 1000 + 500);
      return;
    }

    // ── ANSWER ─────────────────────────────────────────────────────────────────
    if (msg.type === "answer") {
      const room = rooms.get(ws.data.roomId);
      if (!room || room.status !== "playing") return;

      const player = room.players.get(playerId);
      if (!player) return;

      const questionIndex = Number(msg.questionIndex);
      const answer = String(msg.answer) as ColorName;
      const question = room.questions[questionIndex];
      if (!question) return;

      player.answeredCount++;
      if (answer === question.color) {
        const now = Date.now();
        const elapsed = Math.max(0, now - (room.startedAt ?? now));
        const timePerQ = (room.duration * 1000) / room.questions.length;
        const speedBonus = Math.max(0, Math.floor(5 - (elapsed % timePerQ) / (timePerQ / 5)));
        player.score += 10 + speedBonus;
      }

      const scores = Array.from(room.players.values())
        .map((p) => ({ id: p.id, username: p.username, score: p.score, answeredCount: p.answeredCount }))
        .sort((a, b) => b.score - a.score);

      broadcast(room, { type: "score_update", scores });
      return;
    }

    // ── LEAVE ROOM ─────────────────────────────────────────────────────────────
    if (msg.type === "leave_room") {
      removePlayer(playerId);
      ws.data.roomId = "";
    }
  },

  close(ws) { removePlayer(ws.data.playerId); },
  error(ws, err) { console.error("WS error:", err); removePlayer(ws.data.playerId); },
};

// ─── Start Server ─────────────────────────────────────────────────────────────

const PORT = Number(process.env.PORT) || 3001;
const HOST = "0.0.0.0";
console.log(`🚀 Colour WAR server running on http://${HOST}:${PORT}`);

export default {
  port: PORT,
  hostname: HOST,
  fetch(req: Request, server: import("bun").Server) {
    const url = new URL(req.url);
    if (url.pathname === "/ws") {
      const upgraded = server.upgrade(req, { data: { playerId: "", roomId: "" } satisfies WSData });
      if (upgraded) return undefined;
      return new Response("WebSocket upgrade failed", { status: 400 });
    }
    return app.fetch(req);
  },
  websocket: wsHandler,
};

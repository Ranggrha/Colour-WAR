// ─── Color Definitions ────────────────────────────────────────────────────────

export const ALL_COLORS = [
  "MERAH",
  "HIJAU",
  "BIRU",
  "KUNING",
  "UNGU",
  "ORANYE",
  "MERAH_MUDA",
  "TOSCA",
] as const;

export type ColorName = (typeof ALL_COLORS)[number];

export type ColorMode = "klasik" | "menengah" | "sulit";

// Color pools per difficulty
export const COLOR_POOLS: Record<ColorMode, ColorName[]> = {
  klasik:   ["MERAH", "HIJAU", "BIRU", "KUNING"],
  menengah: ["MERAH", "HIJAU", "BIRU", "KUNING", "UNGU", "ORANYE"],
  sulit:    ["MERAH", "HIJAU", "BIRU", "KUNING", "UNGU", "ORANYE", "MERAH_MUDA", "TOSCA"],
};

export const COLOR_MODE_LABEL: Record<ColorMode, string> = {
  klasik:   "Klasik",
  menengah: "Menengah",
  sulit:    "Sulit",
};

export const COLOR_MODE_DESC: Record<ColorMode, string> = {
  klasik:   "4 warna",
  menengah: "6 warna",
  sulit:    "8 warna",
};

export const COLOR_HEX: Record<ColorName, string> = {
  MERAH:      "#FF2D55",
  HIJAU:      "#00C851",
  BIRU:       "#007AFF",
  KUNING:     "#FFD60A",
  UNGU:       "#7C3AED",
  ORANYE:     "#F97316",
  MERAH_MUDA: "#EC4899",
  TOSCA:      "#0891B2",
};

export const COLOR_LABEL: Record<ColorName, string> = {
  MERAH:      "Merah",
  HIJAU:      "Hijau",
  BIRU:       "Biru",
  KUNING:     "Kuning",
  UNGU:       "Ungu",
  ORANYE:     "Oranye",
  MERAH_MUDA: "Merah Muda",
  TOSCA:      "Tosca",
};

// Text color for button label — Kuning needs black text
export const COLOR_TEXT: Record<ColorName, "text-white" | "text-black"> = {
  MERAH:      "text-white",
  HIJAU:      "text-white",
  BIRU:       "text-white",
  KUNING:     "text-black",
  UNGU:       "text-white",
  ORANYE:     "text-white",
  MERAH_MUDA: "text-white",
  TOSCA:      "text-white",
};

// ─── Game Types ───────────────────────────────────────────────────────────────

export interface Question {
  word: ColorName;      // teks yang ditampilkan
  color: ColorName;     // warna font → jawaban benar
  choices: ColorName[]; // 4 pilihan jawaban (sudah diacak, termasuk color)
  index: number;
}

export interface PlayerScore {
  id: string;
  username: string;
  score: number;
  answeredCount: number;
}

export interface RoomPublic {
  id: string;
  hostId: string;
  hostName: string;
  status: "waiting" | "playing" | "finished";
  duration: number;
  maxPlayers: number;
  playerCount: number;
  colorMode: ColorMode;
  players: (PlayerScore & { isHost: boolean })[];
}

// ─── WebSocket Message Types ──────────────────────────────────────────────────

export type WSMessageIn =
  | { type: "create_room"; username: string; duration: number; colorMode: ColorMode }
  | { type: "join_room"; username: string; roomId: string }
  | { type: "start_game" }
  | { type: "answer"; questionIndex: number; answer: ColorName }
  | { type: "leave_room" };

export type WSMessageOut =
  | { type: "connected"; playerId: string }
  | { type: "room_joined"; room: RoomPublic; playerId: string }
  | { type: "room_update"; room: RoomPublic }
  | { type: "game_started"; questions: Question[]; duration: number; startedAt: number }
  | { type: "score_update"; scores: PlayerScore[] }
  | { type: "game_over"; results: PlayerScore[] }
  | { type: "error"; message: string };

// ─── App State Types ──────────────────────────────────────────────────────────

export type AppScreen = "username" | "lobby" | "waiting" | "countdown" | "game" | "result";

export interface AppState {
  screen: AppScreen;
  username: string;
  playerId: string;
  currentRoom: RoomPublic | null;
  questions: Question[];
  gameDuration: number;
  gameStartedAt: number;
  scores: PlayerScore[];
  results: PlayerScore[];
}

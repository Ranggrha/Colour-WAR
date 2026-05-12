import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Users, Clock, RefreshCw, Wifi, WifiOff, Crown } from "lucide-react";
import type { RoomPublic, ColorMode } from "../types";
import { COLOR_MODE_LABEL, COLOR_MODE_DESC, COLOR_POOLS, COLOR_HEX } from "../types";
import type { UseWebSocketReturn } from "../hooks/useWebSocket";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

const DURATION_OPTIONS = [
  { value: 10, label: "10s", desc: "Kilat" },
  { value: 15, label: "15s", desc: "Cepat" },
  { value: 30, label: "30s", desc: "Normal" },
  { value: 60, label: "60s", desc: "Santai" },
  { value: 80, label: "80s", desc: "Maraton" },
];

const COLOR_MODES: ColorMode[] = ["klasik", "menengah", "sulit"];

const MODE_STYLE: Record<ColorMode, { bg: string; border: string; badge: string }> = {
  klasik:   { bg: "bg-brand-lime",   border: "border-black", badge: "bg-brand-lime text-black" },
  menengah: { bg: "bg-brand-yellow", border: "border-black", badge: "bg-brand-yellow text-black" },
  sulit:    { bg: "bg-game-red",     border: "border-black", badge: "bg-game-red text-white" },
};

interface Props {
  username: string;
  isConnected: boolean;
  ws: UseWebSocketReturn;
  onJoinRoom: (roomId: string, duration?: number, colorMode?: ColorMode, isCreating?: boolean) => void;
}

export function LobbyBrowser({ username, isConnected, ws, onJoinRoom }: Props) {
  const [rooms, setRooms] = useState<RoomPublic[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedDuration, setSelectedDuration] = useState(30);
  const [selectedMode, setSelectedMode] = useState<ColorMode>("klasik");
  const [creating, setCreating] = useState(false);
  const [joining, setJoining] = useState<string | null>(null);

  const fetchRooms = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/api/rooms`);
      const data = await res.json();
      setRooms(data.rooms ?? []);
    } catch {
      setRooms([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRooms();
    const interval = setInterval(fetchRooms, 4000);
    return () => clearInterval(interval);
  }, [fetchRooms]);

  const handleCreate = () => {
    if (!isConnected || creating) return;
    setCreating(true);
    ws.sendMessage({ type: "create_room", username, duration: selectedDuration, colorMode: selectedMode });
    onJoinRoom("", selectedDuration, selectedMode, true);
  };

  const handleJoin = (roomId: string) => {
    if (!isConnected || joining) return;
    setJoining(roomId);
    ws.sendMessage({ type: "join_room", username, roomId });
    onJoinRoom(roomId, undefined, undefined, false);
  };

  const modeBadgeStyle = MODE_STYLE[selectedMode];

  return (
    <div className="min-h-dvh flex flex-col bg-[#F5F0E8]">
      {/* Header */}
      <header className="border-b-2 border-black bg-black text-white px-4 py-3 flex items-center justify-between sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <span className="text-xl font-extrabold tracking-tight">
            <span className="text-brand-yellow">COLOUR</span> WAR
          </span>
          <div
            className={`flex items-center gap-1 text-xs font-bold px-2 py-0.5 border ${isConnected
              ? "border-brand-lime text-brand-lime"
              : "border-red-400 text-red-400 animate-pulse"
            }`}
          >
            {isConnected ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
            {isConnected ? "ONLINE" : "OFFLINE"}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400 hidden sm:block">Halo,</span>
          <span className="bg-brand-yellow text-black text-sm font-extrabold px-3 py-1 border-2 border-brand-yellow shadow-brutal-sm">
            {username}
          </span>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-2xl w-full mx-auto px-4 py-6 space-y-5">
        <div className="flex gap-3">
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => setShowCreateModal(true)}
            disabled={!isConnected}
            className="nb-btn-primary flex-1 flex items-center justify-center gap-2 py-4 text-base font-extrabold uppercase tracking-wider disabled:opacity-50"
          >
            <Plus className="w-5 h-5" />
            Buat Lobby
          </motion.button>
          <motion.button
            whileTap={{ rotate: 180, scale: 0.9 }}
            transition={{ duration: 0.3 }}
            onClick={fetchRooms}
            className="nb-btn-secondary px-4"
            title="Refresh"
          >
            <RefreshCw className="w-5 h-5" />
          </motion.button>
        </div>

        {/* Room List */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-extrabold uppercase tracking-wide">🎮 Active Lobby</h2>
            <span className="nb-badge bg-black text-white">{rooms.length} room</span>
          </div>

          {loading ? (
            <div className="flex flex-col gap-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="nb-card p-4 animate-pulse h-20 bg-gray-100" />
              ))}
            </div>
          ) : rooms.length === 0 ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="nb-card p-8 text-center">
              <p className="text-3xl mb-2">🏜️</p>
              <p className="font-bold text-lg">Belum ada lobby aktif</p>
              <p className="text-sm text-gray-500 mt-1">Jadilah yang pertama membuat room!</p>
            </motion.div>
          ) : (
            <motion.div layout className="flex flex-col gap-3">
              <AnimatePresence>
                {rooms.map((room) => {
                  const modeStyle = MODE_STYLE[room.colorMode] ?? MODE_STYLE.klasik;
                  const pool = COLOR_POOLS[room.colorMode] ?? COLOR_POOLS.klasik;
                  return (
                    <motion.div
                      key={room.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      className="nb-card p-4 flex items-center gap-3"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Crown className="w-4 h-4 text-brand-yellow flex-shrink-0" />
                          <span className="font-extrabold truncate">{room.hostName}</span>
                          <span className="nb-badge bg-brand-yellow text-black text-xs">#{room.id}</span>
                        </div>
                        <div className="flex items-center flex-wrap gap-2 text-xs font-semibold text-gray-600">
                          <span className="flex items-center gap-1">
                            <Users className="w-3 h-3" />{room.playerCount}/{room.maxPlayers}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />{room.duration}s
                          </span>
                          {/* Color mode badge */}
                          <span className={`nb-badge ${modeStyle.badge}`}>
                            {COLOR_MODE_LABEL[room.colorMode]}
                          </span>
                          {/* Color dots */}
                          <span className="flex gap-0.5">
                            {pool.map((c) => (
                              <span
                                key={c}
                                className="inline-block w-3 h-3 border border-black rounded-full flex-shrink-0"
                                style={{ backgroundColor: COLOR_HEX[c] }}
                                title={c}
                              />
                            ))}
                          </span>
                        </div>
                      </div>
                      <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleJoin(room.id)}
                        disabled={!isConnected || joining !== null || room.playerCount >= room.maxPlayers}
                        className="nb-btn bg-game-blue text-white px-4 py-2 text-sm font-bold disabled:opacity-40 flex-shrink-0"
                      >
                        {joining === room.id ? "..." : "Join →"}
                      </motion.button>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </motion.div>
          )}
        </div>
      </main>

      {/* Create Lobby Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black z-30"
              onClick={() => setShowCreateModal(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: 60, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 60, scale: 0.95 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="fixed bottom-0 left-0 right-0 z-40 sm:fixed sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:max-w-md sm:w-full sm:bottom-auto"
            >
              <div className="nb-card p-5 rounded-t-2xl sm:rounded-none max-h-[90dvh] overflow-y-auto">
                <h3 className="text-xl font-extrabold mb-4 uppercase">Buat Lobby Baru</h3>

                {/* Duration Selector */}
                <p className="text-sm font-semibold mb-2 text-gray-600">⏱ Durasi Game:</p>
                <div className="grid grid-cols-5 gap-2 mb-5">
                  {DURATION_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setSelectedDuration(opt.value)}
                      className={`border-2 border-black p-2 text-center transition-all duration-75 ${
                        selectedDuration === opt.value
                          ? "bg-black text-brand-yellow shadow-brutal-sm translate-x-[2px] translate-y-[2px]"
                          : "bg-white text-black shadow-brutal-sm hover:bg-gray-50 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
                      }`}
                    >
                      <div className="font-extrabold text-sm">{opt.label}</div>
                      <div className="text-xs opacity-70">{opt.desc}</div>
                    </button>
                  ))}
                </div>

                {/* Color Mode Selector */}
                <p className="text-sm font-semibold mb-2 text-gray-600">🎨 Mode Warna (Kesulitan):</p>
                <div className="flex flex-col gap-2 mb-5">
                  {COLOR_MODES.map((mode) => {
                    const pool = COLOR_POOLS[mode];
                    const style = MODE_STYLE[mode];
                    const isSelected = selectedMode === mode;
                    return (
                      <button
                        key={mode}
                        onClick={() => setSelectedMode(mode)}
                        className={`flex items-center gap-3 border-2 border-black p-3 text-left transition-all duration-75 ${
                          isSelected
                            ? `${style.bg} shadow-brutal-sm translate-x-[2px] translate-y-[2px]`
                            : "bg-white shadow-brutal-sm hover:bg-gray-50 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
                        }`}
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-extrabold text-sm uppercase tracking-wide">
                              {COLOR_MODE_LABEL[mode]}
                            </span>
                            <span className={`nb-badge text-xs ${isSelected ? "bg-black text-white" : "bg-gray-100 text-gray-700"}`}>
                              {COLOR_MODE_DESC[mode]}
                            </span>
                          </div>
                          {/* Color dot preview */}
                          <div className="flex gap-1 mt-1.5">
                            {pool.map((c) => (
                              <span
                                key={c}
                                className="inline-block w-4 h-4 border-2 border-black"
                                style={{ backgroundColor: COLOR_HEX[c] }}
                                title={c}
                              />
                            ))}
                          </div>
                        </div>
                        {isSelected && (
                          <span className="text-lg">✓</span>
                        )}
                      </button>
                    );
                  })}
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => { setShowCreateModal(false); setCreating(false); }}
                    className="nb-btn-secondary flex-1 py-3 font-bold"
                  >
                    Batal
                  </button>
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={handleCreate}
                    disabled={creating}
                    className="nb-btn-primary flex-1 py-3 font-extrabold uppercase disabled:opacity-50"
                  >
                    {creating ? "Membuat..." : "Buat! →"}
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

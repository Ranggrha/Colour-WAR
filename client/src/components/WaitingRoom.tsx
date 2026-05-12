import { motion, AnimatePresence } from "framer-motion";
import { Crown, Users, Clock, Copy, CheckCheck } from "lucide-react";
import { useState } from "react";
import type { RoomPublic } from "../types";
import { COLOR_MODE_LABEL, COLOR_HEX, COLOR_POOLS } from "../types";
import type { UseWebSocketReturn } from "../hooks/useWebSocket";

interface Props {
  room: RoomPublic;
  playerId: string;
  username: string;
  ws: UseWebSocketReturn;
  onLeave: () => void;
}

export function WaitingRoom({ room, playerId, username, ws, onLeave }: Props) {
  const isHost = room.hostId === playerId;
  const [copied, setCopied] = useState(false);
  const canStart = room.players.length >= 2;

  const copyRoomId = async () => {
    await navigator.clipboard.writeText(room.id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleStart = () => {
    if (!isHost || !canStart) return;
    ws.sendMessage({ type: "start_game" });
  };

  const handleLeave = () => {
    ws.sendMessage({ type: "leave_room" });
    onLeave();
  };

  const playerColors = ["bg-brand-yellow", "bg-brand-pink", "bg-brand-cyan", "bg-brand-lime"];

  return (
    <div className="min-h-dvh flex flex-col bg-[#F5F0E8]">
      {/* Header */}
      <header className="border-b-2 border-black bg-black text-white px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xl font-extrabold tracking-tight">
            <span className="text-brand-yellow">COLOUR</span> WAR
          </span>
          <span className="bg-brand-yellow text-black text-xs font-extrabold px-2 py-0.5">
            WAITING ROOM
          </span>
        </div>
        <button
          onClick={handleLeave}
          className="text-red-400 text-sm font-bold hover:text-red-300 transition-colors"
        >
          Keluar ✕
        </button>
      </header>

      <main className="flex-1 max-w-lg w-full mx-auto px-4 py-6 flex flex-col gap-5">
        {/* Room Info Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="nb-card p-4"
        >
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold uppercase tracking-wide text-gray-500">Room ID</h2>
            <button
              onClick={copyRoomId}
              className="flex items-center gap-1 text-xs font-bold text-gray-500 hover:text-black transition-colors"
            >
              {copied ? (
                <>
                  <CheckCheck className="w-3 h-3 text-green-500" />
                  <span className="text-green-500">Disalin!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3" />
                  Salin
                </>
              )}
            </button>
          </div>
          <div className="text-4xl font-extrabold tracking-widest text-center py-2 bg-brand-yellow border-2 border-black shadow-brutal-sm">
            {room.id}
          </div>
          <div className="flex items-center justify-center gap-4 mt-3 text-sm font-semibold text-gray-600">
            <span className="flex items-center gap-1">
              <Users className="w-4 h-4" />
              {room.players.length}/{room.maxPlayers} pemain
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              Durasi: {room.duration}s
            </span>
          </div>
          {/* Color mode + dot preview */}
          <div className="flex items-center justify-center gap-2 mt-2">
            <span className="nb-badge bg-black text-white text-xs">
              🎨 {COLOR_MODE_LABEL[room.colorMode]}
            </span>
            <span className="flex gap-1">
              {(COLOR_POOLS[room.colorMode] ?? []).map((c) => (
                <span
                  key={c}
                  className="inline-block w-3.5 h-3.5 border-2 border-black"
                  style={{ backgroundColor: COLOR_HEX[c] }}
                  title={c}
                />
              ))}
            </span>
          </div>
        </motion.div>

        {/* Player List */}
        <div>
          <h3 className="font-extrabold uppercase tracking-wide mb-3 text-sm text-gray-500">
            Pemain ({room.players.length}/{room.maxPlayers})
          </h3>
          <div className="flex flex-col gap-2">
            <AnimatePresence>
              {room.players.map((player, idx) => (
                <motion.div
                  key={player.id}
                  initial={{ opacity: 0, x: -30 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 30 }}
                  transition={{ delay: idx * 0.08 }}
                  className="flex items-center gap-3 nb-card p-3"
                >
                  <div
                    className={`w-10 h-10 ${playerColors[idx % playerColors.length]} border-2 border-black flex items-center justify-center text-black font-extrabold text-base flex-shrink-0`}
                  >
                    {player.username[0].toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold truncate">
                        {player.username}
                        {player.id === playerId && (
                          <span className="ml-1 text-xs text-gray-500">(kamu)</span>
                        )}
                      </span>
                      {player.isHost && (
                        <Crown className="w-4 h-4 text-brand-yellow flex-shrink-0" />
                      )}
                    </div>
                    <p className="text-xs text-gray-500 font-medium">
                      {player.isHost ? "Host" : "Player"}
                    </p>
                  </div>
                  <div className="nb-badge bg-brand-lime text-black">SIAP</div>
                </motion.div>
              ))}

              {/* Empty slots */}
              {Array.from({ length: room.maxPlayers - room.players.length }).map((_, i) => (
                <motion.div
                  key={`empty-${i}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-center gap-3 border-2 border-dashed border-gray-300 p-3"
                >
                  <div className="w-10 h-10 border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-300 text-xl">
                    +
                  </div>
                  <span className="text-sm text-gray-400 font-medium">Menunggu pemain...</span>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>

        {/* Action Section */}
        <div className="mt-auto pt-4 space-y-3">
          {isHost ? (
            <>
              {!canStart && (
                <motion.p
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  className="text-center text-sm font-bold text-gray-500"
                >
                  ⏳ Menunggu minimal 2 pemain...
                </motion.p>
              )}
              <motion.button
                whileTap={canStart ? { scale: 0.97 } : {}}
                onClick={handleStart}
                disabled={!canStart}
                className={`w-full nb-btn py-5 text-lg font-extrabold uppercase tracking-wider transition-all ${
                  canStart
                    ? "bg-brand-lime text-black border-black shadow-brutal-lg hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-brutal"
                    : "bg-gray-200 text-gray-400 border-gray-300 shadow-none cursor-not-allowed"
                }`}
              >
                🚀 Mulai Game!
              </motion.button>
            </>
          ) : (
            <div className="nb-card p-4 text-center bg-brand-yellow">
              <motion.p
                animate={{ scale: [1, 1.04, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="font-extrabold text-base"
              >
                ⏳ Menunggu host memulai game...
              </motion.p>
              <p className="text-sm text-gray-600 mt-1 font-medium">
                Host: <strong>{room.hostName}</strong>
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

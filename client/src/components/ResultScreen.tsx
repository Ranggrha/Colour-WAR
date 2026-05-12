import { motion } from "framer-motion";
import type { PlayerScore } from "../types";

interface Props {
  results: PlayerScore[];
  playerId: string;
  onPlayAgain: () => void;
  onLeaveLobby: () => void;
}

const RANK_CONFIG = [
  { bg: "bg-brand-yellow", border: "border-black", label: "🥇", size: "text-3xl" },
  { bg: "bg-gray-200",     border: "border-black", label: "🥈", size: "text-2xl" },
  { bg: "bg-orange-100",   border: "border-black", label: "🥉", size: "text-xl" },
  { bg: "bg-white",        border: "border-black", label: "4️⃣", size: "text-lg" },
];

export function ResultScreen({ results, playerId, onPlayAgain, onLeaveLobby }: Props) {
  const myResult = results.find((r) => r.id === playerId);
  const myRank = results.findIndex((r) => r.id === playerId) + 1;
  const isWinner = myRank === 1;

  return (
    <div className="min-h-dvh flex flex-col bg-[#F5F0E8] overflow-hidden">
      {/* Header */}
      <header className="border-b-2 border-black bg-black text-white px-4 py-3 text-center">
        <span className="text-xl font-extrabold">
          <span className="text-brand-yellow">COLOUR</span> WAR — HASIL
        </span>
      </header>

      <main className="flex-1 flex flex-col items-center px-4 py-6 max-w-lg mx-auto w-full gap-6">
        {/* Winner Banner */}
        <motion.div
          initial={{ scale: 0, rotate: -10 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.1 }}
          className="w-full"
        >
          {isWinner ? (
            <div className="nb-card bg-brand-yellow p-5 text-center border-4 border-black shadow-brutal-xl">
              <motion.div
                animate={{ rotate: [0, -5, 5, -5, 5, 0] }}
                transition={{ duration: 0.6, delay: 0.5 }}
                className="text-5xl mb-2"
              >
                🏆
              </motion.div>
              <h1 className="text-2xl font-extrabold uppercase tracking-tight">
                KAMU MENANG!
              </h1>
              <p className="text-sm font-semibold mt-1 text-gray-700">
                Otakmu jauh lebih cepat dari yang lain!
              </p>
            </div>
          ) : (
            <div className="nb-card bg-white p-4 text-center border-2 border-black shadow-brutal">
              <div className="text-4xl mb-1">{RANK_CONFIG[myRank - 1]?.label || "👤"}</div>
              <h1 className="text-xl font-extrabold uppercase">
                Peringkat #{myRank}
              </h1>
              <p className="text-sm text-gray-500 font-medium mt-1">
                {myRank === 2 ? "Hampir! Latih lagi kecepatanmu." : "Terus coba, kamu bisa!"}
              </p>
            </div>
          )}
        </motion.div>

        {/* Leaderboard */}
        <div className="w-full">
          <h2 className="font-extrabold uppercase tracking-wide text-sm text-gray-500 mb-3">
            🏅 Papan Skor Final
          </h2>
          <div className="flex flex-col gap-2">
            {results.map((player, idx) => {
              const cfg = RANK_CONFIG[idx] || RANK_CONFIG[3];
              const isMe = player.id === playerId;

              return (
                <motion.div
                  key={player.id}
                  initial={{ opacity: 0, x: -30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 + idx * 0.1 }}
                  className={`flex items-center gap-3 border-2 ${cfg.border} p-3 ${cfg.bg} ${
                    isMe ? "shadow-brutal" : "shadow-brutal-sm"
                  } ${isMe ? "scale-[1.02]" : ""}`}
                >
                  <span className={`${cfg.size} flex-shrink-0 w-8 text-center`}>
                    {cfg.label}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="font-extrabold truncate flex items-center gap-1">
                      {player.username}
                      {isMe && (
                        <span className="text-xs font-bold text-gray-500">(kamu)</span>
                      )}
                    </div>
                    <div className="text-xs font-semibold text-gray-600">
                      {player.answeredCount} soal dijawab
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.4 + idx * 0.1, type: "spring" }}
                      className="text-2xl font-extrabold"
                    >
                      {player.score}
                    </motion.div>
                    <div className="text-xs text-gray-500 font-medium">poin</div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* My Stats */}
        {myResult && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="w-full nb-card p-4 bg-black text-white"
          >
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">
              Statistik Kamu
            </h3>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div>
                <div className="text-2xl font-extrabold text-brand-yellow">
                  {myResult.score}
                </div>
                <div className="text-xs text-gray-400 font-medium">Total Poin</div>
              </div>
              <div>
                <div className="text-2xl font-extrabold text-brand-cyan">
                  {myResult.answeredCount}
                </div>
                <div className="text-xs text-gray-400 font-medium">Dijawab</div>
              </div>
              <div>
                <div className="text-2xl font-extrabold text-brand-lime">
                  #{myRank}
                </div>
                <div className="text-xs text-gray-400 font-medium">Peringkat</div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="w-full flex flex-col gap-3 pb-4"
        >
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={onPlayAgain}
            className="nb-btn-primary w-full py-4 text-lg font-extrabold uppercase tracking-wider"
          >
            🔁 Main Lagi (Lobby)
          </motion.button>
          <button
            onClick={onLeaveLobby}
            className="nb-btn-secondary w-full py-3 font-bold text-sm"
          >
            Kembali ke Dashboard
          </button>
        </motion.div>
      </main>
    </div>
  );
}

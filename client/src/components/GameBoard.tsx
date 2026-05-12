import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  type ColorName, COLOR_HEX, COLOR_LABEL, COLOR_TEXT,
  type Question, type PlayerScore,
} from "../types";
import type { UseWebSocketReturn } from "../hooks/useWebSocket";

interface Props {
  questions: Question[];
  duration: number;
  startedAt: number;
  playerId: string;
  scores: PlayerScore[];
  username: string;
  ws: UseWebSocketReturn;
}

export function GameBoard({ questions, duration, startedAt, playerId, scores, username, ws }: Props) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(duration);
  const [lastResult, setLastResult] = useState<"correct" | "wrong" | null>(null);
  const [localScore, setLocalScore] = useState(0);
  const [answeredCount, setAnsweredCount] = useState(0);
  const [combo, setCombo] = useState(0);
  const [isAnswering, setIsAnswering] = useState(false);
  const resultTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const currentQ = questions[currentIndex];

  // Countdown timer — only starts when startedAt is reached
  useEffect(() => {
    const tick = setInterval(() => {
      const elapsed = (Date.now() - startedAt) / 1000;
      const remaining = Math.max(0, duration - elapsed);
      setTimeLeft(remaining);
      if (remaining <= 0) clearInterval(tick);
    }, 100);
    return () => clearInterval(tick);
  }, [duration, startedAt]);

  const handleAnswer = useCallback(
    (answer: ColorName) => {
      if (!currentQ || isAnswering || timeLeft <= 0) return;

      setIsAnswering(true);
      setAnsweredCount((c) => c + 1);

      const isCorrect = answer === currentQ.color;
      if (isCorrect) {
        setLocalScore((s) => s + 10);
        setCombo((c) => c + 1);
        setLastResult("correct");
      } else {
        setCombo(0);
        setLastResult("wrong");
      }

      ws.sendMessage({ type: "answer", questionIndex: currentQ.index, answer });
      setCurrentIndex((i) => Math.min(i + 1, questions.length - 1));

      if (resultTimerRef.current) clearTimeout(resultTimerRef.current);
      resultTimerRef.current = setTimeout(() => {
        setLastResult(null);
        setIsAnswering(false);
      }, 350);
    },
    [currentQ, isAnswering, timeLeft, ws, questions.length]
  );

  const myServerScore = scores.find((s) => s.id === playerId);
  const timerPercent = (timeLeft / duration) * 100;
  const timerColor = timerPercent > 50 ? "bg-game-green" : timerPercent > 25 ? "bg-game-yellow" : "bg-game-red";
  const isUrgent = timeLeft <= 5 && timeLeft > 0;

  // choices always come from the server (4 items, shuffled)
  const choices: ColorName[] = currentQ?.choices ?? [];

  // Determine grid layout based on choice count
  const gridCols = choices.length <= 4 ? "grid-cols-2" : "grid-cols-2 sm:grid-cols-3";

  return (
    <div className="min-h-dvh flex flex-col bg-[#F5F0E8] select-none">
      {/* Top HUD */}
      <div className="border-b-2 border-black bg-black text-white">
        {/* Timer bar */}
        <div className="h-2 bg-gray-800 relative overflow-hidden">
          <motion.div
            className={`h-full ${timerColor} transition-colors duration-500`}
            style={{ width: `${timerPercent}%` }}
          />
        </div>
        <div className="px-4 py-2 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <motion.span
              key={Math.round(timeLeft)}
              animate={isUrgent ? { scale: [1, 1.3, 1] } : {}}
              transition={{ duration: 0.3 }}
              className={`text-2xl font-extrabold tabular-nums ${isUrgent ? "text-game-red" : "text-white"}`}
            >
              {Math.ceil(Math.max(0, timeLeft))}s
            </motion.span>
            {combo >= 3 && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="bg-brand-yellow text-black text-xs font-extrabold px-2 py-0.5 border border-brand-yellow"
              >
                🔥 COMBO x{combo}
              </motion.div>
            )}
          </div>
          <div className="text-right">
            <div className="text-xs text-gray-400 font-medium">SKOR</div>
            <motion.div
              key={myServerScore?.score ?? localScore}
              initial={{ scale: 1.4, color: "#FFE500" }}
              animate={{ scale: 1, color: "#ffffff" }}
              className="text-xl font-extrabold tabular-nums"
            >
              {myServerScore?.score ?? localScore}
            </motion.div>
          </div>
        </div>
      </div>

      {/* Live Scoreboard mini */}
      {scores.length > 0 && (
        <div className="flex overflow-x-auto gap-2 px-3 py-2 border-b-2 border-black bg-white">
          {scores.slice(0, 4).map((s, i) => (
            <div
              key={s.id}
              className={`flex items-center gap-1.5 flex-shrink-0 px-2 py-1 border-2 border-black text-xs font-bold ${
                s.id === playerId ? "bg-brand-yellow" : "bg-white"
              }`}
            >
              <span className="text-gray-500">#{i + 1}</span>
              <span className="truncate max-w-[60px]">{s.username}</span>
              <span className="font-extrabold">{s.score}</span>
            </div>
          ))}
        </div>
      )}

      {/* Game Area */}
      <div className="flex-1 flex flex-col items-center justify-between px-4 py-4 gap-4">
        <div className="text-xs font-bold text-gray-500 uppercase tracking-wider">
          Soal {Math.min(currentIndex + 1, questions.length)} / {questions.length}
        </div>

        {/* Word Display */}
        <div className="flex-1 flex items-center justify-center w-full">
          <AnimatePresence mode="wait">
            {currentQ && (
              <motion.div
                key={currentIndex}
                initial={{ opacity: 0, scale: 0.6, rotate: -5 }}
                animate={{ opacity: 1, scale: 1, rotate: 0 }}
                exit={{ opacity: 0, scale: 1.2, rotate: 5 }}
                transition={{ type: "spring", stiffness: 400, damping: 20 }}
                className="relative"
              >
                <AnimatePresence>
                  {lastResult && (
                    <motion.div
                      key={lastResult}
                      initial={{ opacity: 1, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 1.3 }}
                      className={`absolute inset-0 flex items-center justify-center z-10 pointer-events-none text-5xl font-extrabold ${
                        lastResult === "correct" ? "text-game-green" : "text-game-red"
                      }`}
                    >
                      {lastResult === "correct" ? "✓" : "✗"}
                    </motion.div>
                  )}
                </AnimatePresence>

                <div
                  className="border-4 border-black shadow-brutal-xl px-8 py-6 bg-white text-center"
                  style={{ minWidth: "200px" }}
                >
                  <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">
                    TEBAK WARNA FONT-NYA!
                  </p>
                  <motion.p
                    style={{ color: COLOR_HEX[currentQ.color] }}
                    className="text-6xl sm:text-7xl font-extrabold tracking-tight leading-none"
                  >
                    {COLOR_LABEL[currentQ.word].toUpperCase()}
                  </motion.p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Answer Buttons — dynamic from question.choices */}
        <div className={`w-full max-w-sm grid ${gridCols} gap-3`}>
          {choices.map((color) => (
            <motion.button
              key={color}
              whileTap={{ scale: 0.93, x: 3, y: 3 }}
              onPointerDown={(e) => { e.preventDefault(); handleAnswer(color); }}
              disabled={timeLeft <= 0}
              className={`game-btn nb-btn border-black shadow-brutal-lg
                active:shadow-none active:translate-x-[6px] active:translate-y-[6px]
                disabled:opacity-40 disabled:cursor-not-allowed
                h-16 sm:h-20 text-base sm:text-xl font-extrabold
                ${COLOR_TEXT[color]}`}
              style={{ backgroundColor: COLOR_HEX[color] }}
            >
              {COLOR_LABEL[color].toUpperCase()}
            </motion.button>
          ))}
        </div>

        <div className="flex gap-4 text-xs text-gray-500 font-semibold pb-2">
          <span>Dijawab: <strong className="text-black">{answeredCount}</strong></span>
          {combo >= 2 && <span>Streak: <strong className="text-game-red">{combo}🔥</strong></span>}
        </div>
      </div>
    </div>
  );
}

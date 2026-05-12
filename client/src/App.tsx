import { useCallback, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useWebSocket } from "./hooks/useWebSocket";
import { UsernameInput } from "./components/UsernameInput";
import { LobbyBrowser } from "./components/LobbyBrowser";
import { WaitingRoom } from "./components/WaitingRoom";
import { CountdownOverlay } from "./components/CountdownOverlay";
import { GameBoard } from "./components/GameBoard";
import { ResultScreen } from "./components/ResultScreen";
import type {
  AppScreen,
  Question,
  PlayerScore,
  RoomPublic,
  WSMessageOut,
} from "./types";

// ── Screen transition variants ──────────────────────────────────────────────
const pageVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
};

const pageTransition = { duration: 0.25, ease: "easeInOut" };

export default function App() {
  const [screen, setScreen] = useState<AppScreen>("username");
  const [username, setUsername] = useState("");
  const [playerId, setPlayerId] = useState("");
  const [currentRoom, setCurrentRoom] = useState<RoomPublic | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [gameDuration, setGameDuration] = useState(30);
  const [gameStartedAt, setGameStartedAt] = useState(0);
  const [scores, setScores] = useState<PlayerScore[]>([]);
  const [results, setResults] = useState<PlayerScore[]>([]);
  const [wsError, setWsError] = useState<string | null>(null);

  // ── WebSocket message handler ──────────────────────────────────────────────
  const handleMessage = useCallback((msg: WSMessageOut) => {
    switch (msg.type) {
      case "connected":
        setPlayerId(msg.playerId);
        break;

      case "room_joined":
        setCurrentRoom(msg.room);
        setPlayerId(msg.playerId);
        setScreen("waiting");
        break;

      case "room_update":
        setCurrentRoom(msg.room);
        break;

      case "game_started":
        setQuestions(msg.questions);
        setGameDuration(msg.duration);
        setGameStartedAt(msg.startedAt);
        setScores([]);
        setScreen("countdown"); // ← countdown dulu, baru game
        break;

      case "score_update":
        setScores(msg.scores);
        break;

      case "game_over":
        setResults(msg.results);
        setScreen("result");
        break;

      case "error":
        setWsError(msg.message);
        setTimeout(() => setWsError(null), 3000);
        break;
    }
  }, []);

  const ws = useWebSocket(handleMessage);

  // ── Navigation Handlers ────────────────────────────────────────────────────
  const handleUsernameSubmit = (name: string) => {
    setUsername(name);
    setScreen("lobby");
  };

  const handleJoinRoom = (
    _roomId: string,
    duration?: number,
    _colorMode?: import("./types").ColorMode,
    _isCreating?: boolean
  ) => {
    if (duration) setGameDuration(duration);
    // Screen will change to "waiting" when server sends room_joined
  };

  const handleLeaveRoom = () => {
    setCurrentRoom(null);
    setScreen("lobby");
  };

  const handlePlayAgain = () => {
    // Go back to waiting room if room still exists, else lobby
    if (currentRoom) {
      setScreen("waiting");
    } else {
      setScreen("lobby");
    }
  };

  const handleLeaveLobby = () => {
    ws.sendMessage({ type: "leave_room" });
    setCurrentRoom(null);
    setScreen("lobby");
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="relative">
      {/* Global WS Error Toast */}
      <AnimatePresence>
        {wsError && (
          <motion.div
            initial={{ opacity: 0, y: -40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -40 }}
            className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-game-red text-white border-2 border-black shadow-brutal px-4 py-2 font-bold text-sm"
          >
            ⚠ {wsError}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Connection toast */}
      <AnimatePresence>
        {ws.isConnecting && screen !== "username" && (
          <motion.div
            initial={{ opacity: 0, y: -40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -40 }}
            className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-black text-brand-yellow border-2 border-brand-yellow shadow-brutal px-4 py-2 font-bold text-sm animate-pulse_fast"
          >
            ⚡ Menyambungkan ulang...
          </motion.div>
        )}
      </AnimatePresence>

      {/* Screen transitions */}
      <AnimatePresence mode="wait">
        {screen === "username" && (
          <motion.div
            key="username"
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={pageTransition}
          >
            <UsernameInput onSubmit={handleUsernameSubmit} />
          </motion.div>
        )}

        {screen === "lobby" && (
          <motion.div
            key="lobby"
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={pageTransition}
          >
            <LobbyBrowser
              username={username}
              isConnected={ws.isConnected}
              ws={ws}
              onJoinRoom={handleJoinRoom}
            />
          </motion.div>
        )}

        {screen === "waiting" && currentRoom && (
          <motion.div
            key="waiting"
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={pageTransition}
          >
            <WaitingRoom
              room={currentRoom}
              playerId={playerId}
              username={username}
              ws={ws}
              onLeave={handleLeaveRoom}
            />
          </motion.div>
        )}

        {screen === "countdown" && (
          <motion.div
            key="countdown"
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={pageTransition}
          >
            <CountdownOverlay onComplete={() => setScreen("game")} />
          </motion.div>
        )}

        {screen === "game" && questions.length > 0 && (
          <motion.div
            key="game"
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={pageTransition}
          >
            <GameBoard
              questions={questions}
              duration={gameDuration}
              startedAt={gameStartedAt}
              playerId={playerId}
              scores={scores}
              username={username}
              ws={ws}
            />
          </motion.div>
        )}

        {screen === "result" && (
          <motion.div
            key="result"
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={pageTransition}
          >
            <ResultScreen
              results={results}
              playerId={playerId}
              onPlayAgain={handlePlayAgain}
              onLeaveLobby={handleLeaveLobby}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

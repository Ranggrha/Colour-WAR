import { useState } from "react";
import { motion } from "framer-motion";
import { Zap } from "lucide-react";

interface Props {
  onSubmit: (username: string) => void;
}

export function UsernameInput({ onSubmit }: Props) {
  const [value, setValue] = useState("");
  const [error, setError] = useState("");
  const [shake, setShake] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = value.trim();
    if (trimmed.length < 2) {
      setError("Username minimal 2 karakter!");
      setShake(true);
      setTimeout(() => setShake(false), 400);
      return;
    }
    if (trimmed.length > 16) {
      setError("Username maksimal 16 karakter!");
      setShake(true);
      setTimeout(() => setShake(false), 400);
      return;
    }
    onSubmit(trimmed);
  };

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center p-4 bg-[#F5F0E8]">
      {/* Decorative blobs */}
      <div className="fixed top-0 left-0 w-40 h-40 bg-brand-yellow border-2 border-black opacity-60 -translate-x-12 -translate-y-12 rotate-12 pointer-events-none" />
      <div className="fixed bottom-0 right-0 w-48 h-48 bg-brand-pink border-2 border-black opacity-40 translate-x-16 translate-y-16 -rotate-12 pointer-events-none" />
      <div className="fixed top-1/3 right-0 w-24 h-24 bg-brand-cyan border-2 border-black opacity-50 translate-x-10 rotate-45 pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-sm relative z-10"
      >
        {/* Logo / Title */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1, duration: 0.4 }}
          className="mb-8 text-center"
        >
          <div className="inline-flex items-center gap-2 bg-black text-brand-yellow px-4 py-2 mb-3 shadow-brutal-lg border-2 border-black">
            <Zap className="w-5 h-5 fill-brand-yellow" />
            <span className="text-xs font-bold tracking-widest uppercase">Color-Word Game</span>
          </div>
          <h1 className="text-5xl sm:text-6xl font-extrabold tracking-tighter leading-none">
            <span className="text-game-red">C</span>
            <span className="text-game-blue">O</span>
            <span className="text-game-green">L</span>
            <span className="text-game-yellow">O</span>
            <span className="text-game-red">U</span>
            <span className="text-game-blue">R</span>
            <br />
            <span className="bg-black text-brand-yellow px-2">WAR</span>
          </h1>
          <p className="mt-3 text-sm font-medium text-gray-600 max-w-xs mx-auto">
            Jangan baca katanya — <strong>tebak warnanya!</strong> Uji otakmu melawan pemain lain.
          </p>
        </motion.div>

        {/* Form Card */}
        <motion.form
          animate={shake ? { x: [-8, 8, -8, 8, 0] } : {}}
          transition={{ duration: 0.35 }}
          onSubmit={handleSubmit}
          className="nb-card p-6 space-y-4"
        >
          <div>
            <label
              htmlFor="username"
              className="block text-sm font-bold mb-2 uppercase tracking-wide"
            >
              Username Kamu
            </label>
            <input
              id="username"
              type="text"
              value={value}
              onChange={(e) => {
                setValue(e.target.value);
                setError("");
              }}
              placeholder="Masukkan username..."
              maxLength={16}
              autoComplete="off"
              autoFocus
              className="nb-input"
            />
            {error && (
              <motion.p
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-2 text-sm font-bold text-game-red"
              >
                ⚠ {error}
              </motion.p>
            )}
          </div>

          <motion.button
            whileTap={{ scale: 0.97 }}
            type="submit"
            className="nb-btn-primary w-full text-lg font-extrabold uppercase tracking-widest py-4"
          >
            Mulai Main! →
          </motion.button>
        </motion.form>

        <p className="text-center text-xs text-gray-400 mt-4 font-medium">
          2–4 pemain per room • Real-time multiplayer
        </p>
      </motion.div>
    </div>
  );
}

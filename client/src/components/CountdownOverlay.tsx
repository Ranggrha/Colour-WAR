import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface Props {
  onComplete: () => void;
}

const STEPS = [
  { label: "3", bg: "bg-game-red", text: "text-white" },
  { label: "2", bg: "bg-game-yellow", text: "text-black" },
  { label: "1", bg: "bg-game-green", text: "text-white" },
  { label: "MULAI!", bg: "bg-black", text: "text-brand-yellow" },
];

export function CountdownOverlay({ onComplete }: Props) {
  const [step, setStep] = useState(0); // 0=3, 1=2, 2=1, 3=MULAI!

  useEffect(() => {
    if (step < STEPS.length - 1) {
      // Angka 3,2,1 — masing-masing 900ms
      const t = setTimeout(() => setStep((s) => s + 1), 900);
      return () => clearTimeout(t);
    } else {
      // "MULAI!" tampil 600ms lalu masuk game
      const t = setTimeout(() => onComplete(), 600);
      return () => clearTimeout(t);
    }
  }, [step, onComplete]);

  const current = STEPS[step];

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#F5F0E8]">
      {/* Background noise decoration */}
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none overflow-hidden">
        <div className="absolute top-8 left-8 w-20 h-20 bg-brand-pink border-2 border-black rotate-12 opacity-40" />
        <div className="absolute bottom-12 right-8 w-28 h-28 bg-brand-cyan border-2 border-black -rotate-6 opacity-30" />
        <div className="absolute top-1/3 right-16 w-14 h-14 bg-brand-lime border-2 border-black rotate-45 opacity-50" />
      </div>

      <p className="text-sm font-extrabold uppercase tracking-widest text-gray-500 mb-8 z-10">
        Game dimulai dalam...
      </p>

      {/* Countdown number */}
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ scale: 0.3, opacity: 0, rotate: -15 }}
          animate={{ scale: 1, opacity: 1, rotate: 0 }}
          exit={{ scale: 1.6, opacity: 0, rotate: 10 }}
          transition={{ type: "spring", stiffness: 350, damping: 18 }}
          className={`${current.bg} ${current.text} border-4 border-black shadow-brutal-xl
            flex items-center justify-center z-10
            ${step === 3 ? "w-64 h-32 text-5xl" : "w-44 h-44 text-8xl"}`}
        >
          <span className="font-extrabold leading-none">{current.label}</span>
        </motion.div>
      </AnimatePresence>

      {/* Progress dots */}
      <div className="flex gap-3 mt-10 z-10">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            animate={{
              backgroundColor: i < step ? "#0D0D0D" : i === step ? "#FFE500" : "#D1D5DB",
              scale: i === step ? 1.25 : 1,
            }}
            transition={{ duration: 0.3 }}
            className="w-4 h-4 border-2 border-black"
          />
        ))}
      </div>
    </div>
  );
}

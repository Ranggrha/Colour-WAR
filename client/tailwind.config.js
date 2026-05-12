/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Space Grotesk", "system-ui", "sans-serif"],
        display: ["Space Grotesk", "system-ui", "sans-serif"],
      },
      colors: {
        // Neo-brutalist palette
        brand: {
          yellow: "#FFE500",
          pink: "#FF3CAC",
          cyan: "#00F5FF",
          lime: "#B8FF00",
          orange: "#FF6B00",
          purple: "#7B2FFF",
        },
        game: {
          red:       "#FF2D55",
          green:     "#00C851",
          blue:      "#007AFF",
          yellow:    "#FFD60A",
          purple:    "#7C3AED",
          orange:    "#F97316",
          pink:      "#EC4899",
          teal:      "#0891B2",
        },
      },
      boxShadow: {
        brutal: "4px 4px 0px 0px rgba(0,0,0,1)",
        "brutal-sm": "2px 2px 0px 0px rgba(0,0,0,1)",
        "brutal-lg": "6px 6px 0px 0px rgba(0,0,0,1)",
        "brutal-xl": "8px 8px 0px 0px rgba(0,0,0,1)",
        "brutal-inset": "inset 4px 4px 0px 0px rgba(0,0,0,0.2)",
      },
      keyframes: {
        wiggle: {
          "0%, 100%": { transform: "rotate(-2deg)" },
          "50%": { transform: "rotate(2deg)" },
        },
        pulse_fast: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.5" },
        },
        pop: {
          "0%": { transform: "scale(1)" },
          "50%": { transform: "scale(1.15)" },
          "100%": { transform: "scale(1)" },
        },
      },
      animation: {
        wiggle: "wiggle 0.3s ease-in-out",
        pulse_fast: "pulse_fast 0.8s ease-in-out infinite",
        pop: "pop 0.2s ease-out",
      },
    },
  },
  plugins: [],
};

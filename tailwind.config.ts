import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        brandDark: "#070F1B",
        cardDark: "#0F1E33",
        moroccoRed: "#C1272D",
        emeraldCustom: "#10B981",
        royal: {
          DEFAULT: "#0B1F3A",
          800: "#122C52",
          700: "#1A3D6E",
          600: "#254A82",
        },
        emerald: {
          DEFAULT: "#0F6B4C",
          600: "#14805C",
          500: "#1A946B",
        },
        gold: {
          DEFAULT: "#D4AF37",
          50: "#FDFBF0",
          100: "#FDF7DF",
          200: "#F3E9C8",
          300: "#E8D5A3",
          400: "#D4AF37",
          600: "#AA820A",
        },
        amber: {
          DEFAULT: "#D97706",
          400: "#F59E0B",
          100: "#FEF3C7",
        },
        bronze: { DEFAULT: "#B87333" },
        cream: { DEFAULT: "#FAF8F5" },
      },
      fontFamily: {
        cairo: ["var(--font-cairo)", "Cairo", "Tahoma", "sans-serif"],
        tajawal: ["var(--font-tajawal)", "Tajawal", "sans-serif"],
        cinzel: ["var(--font-cinzel)", "Cinzel", "serif"],
      },
      boxShadow: {
        gold: "0 10px 30px rgba(201, 162, 39, 0.18)",
        luxury: "0 15px 35px -10px rgba(212, 175, 55, 0.15)",
        drawer: "-12px 0 40px rgba(11, 31, 58, 0.25)",
      },
    },
  },
  plugins: [],
};

export default config;

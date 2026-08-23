import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
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
          DEFAULT: "#C9A227",
          400: "#D4AF37",
          300: "#E8D5A3",
          200: "#F3E9C8",
        },
        bronze: { DEFAULT: "#B87333" },
        cream: { DEFAULT: "#FFFBFA" },
      },
      fontFamily: {
        cairo: ["var(--font-cairo)", "Tahoma", "sans-serif"],
        cinzel: ["var(--font-cinzel)", "serif"],
      },
      boxShadow: {
        gold: "0 10px 30px rgba(201, 162, 39, 0.18)",
        drawer: "-12px 0 40px rgba(11, 31, 58, 0.25)",
      },
    },
  },
  plugins: [],
};

export default config;

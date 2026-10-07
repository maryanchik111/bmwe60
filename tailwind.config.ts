import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: { ink: "#0f0f0f", brand: "#1c4fe4", paper: "#f3f2ef" },
      fontFamily: { sans: ["var(--font-onest)", "system-ui", "sans-serif"] },
    },
  },
  plugins: [],
};
export default config;

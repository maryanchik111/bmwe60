import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bmw: { blue: "#1c69d4", light: "#4d9bff" },
      },
    },
  },
  plugins: [],
};
export default config;

import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        slateDeep: "#0f172a",
      },
      boxShadow: {
        glow: "0 0 60px rgba(56, 189, 248, 0.18)",
      },
      backgroundImage: {
        "hero-mesh": "radial-gradient(circle at 20% 20%, rgba(56,189,248,0.22), transparent 35%), radial-gradient(circle at 80% 10%, rgba(34,197,94,0.18), transparent 35%), radial-gradient(circle at 70% 75%, rgba(244,114,182,0.16), transparent 32%)",
      },
    },
  },
  plugins: [],
};

export default config;
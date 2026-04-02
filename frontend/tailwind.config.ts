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
        glow: "0 0 60px rgba(245, 158, 11, 0.24)",
      },
      backgroundImage: {
        "hero-mesh": "radial-gradient(circle at 20% 20%, rgba(245,158,11,0.24), transparent 35%), radial-gradient(circle at 80% 10%, rgba(132,204,22,0.18), transparent 35%), radial-gradient(circle at 70% 75%, rgba(190,24,93,0.14), transparent 32%)",
      },
    },
  },
  plugins: [],
};

export default config;
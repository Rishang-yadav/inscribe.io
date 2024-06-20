import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/Views/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#1e5458",
        light_gray: "#84848a", // A bit lighter to enhance contrast
        black: "#0c0d0c"
      },
  },
  },
  plugins: [],
};
export default config;

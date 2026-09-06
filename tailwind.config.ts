import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: { extend: { colors: { mauve: { 50: "#fafafb", 100: "#f4f2f6", 200: "#e5e1e8", 300: "#d0c9d5", 400: "#a69bae", 500: "#81758b", 600: "#675d70", 700: "#524959", 800: "#3d3642", 900: "#2a252e", 950: "#161218" } } } },
  plugins: [],
} satisfies Config;

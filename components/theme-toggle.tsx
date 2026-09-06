"use client";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
export function ThemeToggle() { const { resolvedTheme, setTheme } = useTheme(); return <button onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")} aria-label="Toggle color theme" className="grid h-10 w-10 place-items-center rounded-full border border-mauve-300 text-mauve-700 transition hover:bg-mauve-100 dark:border-mauve-700 dark:text-mauve-200 dark:hover:bg-mauve-800">{resolvedTheme === "dark" ? <Sun size={16}/> : <Moon size={16}/>}</button>; }

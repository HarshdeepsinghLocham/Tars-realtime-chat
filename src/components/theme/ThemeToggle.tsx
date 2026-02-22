"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "./ThemeProvider";

export default function ThemeToggle() {
    const { theme, toggleTheme } = useTheme();

    return (
        <button
            type="button"
            onClick={toggleTheme}
            className="p-1.5 rounded-lg text-neutral-500 hover:text-neutral-700 hover:bg-neutral-200/80 dark:text-neutral-400 dark:hover:text-neutral-200 dark:hover:bg-neutral-700/80 transition-colors focus:outline-none focus:ring-2 focus:ring-neutral-400 dark:focus:ring-neutral-500"
            aria-label={theme === "light" ? "Switch to dark mode" : "Switch to light mode"}
        >
            {theme === "light" ? <Moon size={18} /> : <Sun size={18} />}
        </button>
    );
}

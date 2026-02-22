"use client";

import { motion } from "framer-motion";

interface TypingIndicatorProps {
    label: string;
}

export default function TypingIndicator({ label }: TypingIndicatorProps) {
    return (
        <div
            className="flex items-center gap-1.5 px-3 py-2 text-neutral-500 dark:text-neutral-400 text-sm"
            role="status"
            aria-live="polite"
            aria-label={`${label} is typing`}
        >
            <span className="sr-only">{label} is typing</span>
            <motion.span
                animate={{ opacity: [0.4, 1, 0.4] }}
                transition={{ duration: 1, repeat: Infinity }}
                className="w-2 h-2 rounded-full bg-neutral-400"
            />
            <motion.span
                animate={{ opacity: [0.4, 1, 0.4] }}
                transition={{ duration: 1, repeat: Infinity, delay: 0.15 }}
                className="w-2 h-2 rounded-full bg-neutral-400"
            />
            <motion.span
                animate={{ opacity: [0.4, 1, 0.4] }}
                transition={{ duration: 1, repeat: Infinity, delay: 0.3 }}
                className="w-2 h-2 rounded-full bg-neutral-400"
            />
        </div>
    );
}

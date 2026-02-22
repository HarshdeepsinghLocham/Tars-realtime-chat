"use client";

import { useState, useEffect, useRef } from "react";

interface MessageInputProps {
    onSend: (content: string) => void | Promise<unknown>;
    onTyping?: (typing: boolean) => void;
}

const TYPING_DEBOUNCE_MS = 300;
const TYPING_CLEAR_MS = 2000;

export default function MessageInput({ onSend, onTyping }: MessageInputProps) {
    const [message, setMessage] = useState("");
    const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const clearTypingRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const handleSend = async () => {
        if (!message.trim()) return;
        const content = message.trim();
        setMessage("");
        onTyping?.(false);
        if (clearTypingRef.current) {
            clearTimeout(clearTypingRef.current);
            clearTypingRef.current = null;
        }
        await Promise.resolve(onSend(content));
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    useEffect(() => {
        if (!onTyping) return;
        if (message.trim().length > 0) {
            if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
            typingTimeoutRef.current = setTimeout(() => {
                onTyping(true);
                typingTimeoutRef.current = null;
            }, TYPING_DEBOUNCE_MS);
            if (clearTypingRef.current) clearTimeout(clearTypingRef.current);
            clearTypingRef.current = setTimeout(() => {
                onTyping(false);
                clearTypingRef.current = null;
            }, TYPING_CLEAR_MS);
        } else {
            onTyping(false);
            if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current);
                typingTimeoutRef.current = null;
            }
        }
        return () => {
            if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
            if (clearTypingRef.current) clearTimeout(clearTypingRef.current);
        };
    }, [message, onTyping]);

    return (
        <div className="flex items-center gap-2 p-2 rounded-lg bg-neutral-50/80 dark:bg-neutral-800/30 border border-neutral-200 dark:border-neutral-600/80">
            <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Message..."
                rows={1}
                className="flex-1 min-h-10 max-h-30 text-sm px-3 py-2 border border-neutral-200 dark:border-neutral-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-300 dark:focus:ring-neutral-500 focus:border-transparent resize-none bg-white dark:bg-neutral-800/80 text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 dark:placeholder:text-neutral-500 transition-shadow"
                aria-label="Message input"
                aria-describedby="message-input-hint"
            />
            <button
                type="button"
                onClick={handleSend}
                disabled={!message.trim()}
                className="text-sm font-medium px-4 py-2 h-10 rounded-lg bg-neutral-800 dark:bg-neutral-200 text-neutral-100 dark:text-neutral-800 hover:bg-neutral-700 dark:hover:bg-neutral-300 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-neutral-800 dark:disabled:hover:bg-neutral-200 transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-neutral-400 dark:focus:ring-neutral-500 focus:ring-offset-2 dark:focus:ring-offset-neutral-900"
                aria-label="Send message"
            >
                Send
            </button>
            <p id="message-input-hint" className="sr-only">
                Press Enter to send, Shift+Enter for new line
            </p>
        </div>
    );
}

"use client";

import { Doc } from "../../../convex/_generated/dataModel";

interface ChatHeaderProps {
    selectedUserData?: Doc<"users">;
    isOnline?: boolean;
}

export default function ChatHeader({
    selectedUserData,
    isOnline = false,
}: ChatHeaderProps) {
    if (!selectedUserData) return null;

    return (
        <header className="flex items-center justify-between" role="banner">
            <div className="flex items-center gap-3">
                <div className="relative">
                    <img
                        src={selectedUserData.image}
                        alt=""
                        className="w-10 h-10 rounded-full object-cover ring-2 ring-neutral-100 dark:ring-neutral-800"
                    />
                    <span
                        className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white dark:border-neutral-800 ${
                            isOnline ? "bg-emerald-500" : "bg-neutral-300 dark:bg-neutral-600"
                        }`}
                        aria-hidden
                        title={isOnline ? "Online" : "Offline"}
                    />
                </div>
                <div>
                    <p className="font-semibold text-neutral-900 dark:text-neutral-100">
                        {selectedUserData.name}
                    </p>
                    <p className="text-sm text-neutral-500 dark:text-neutral-400" aria-live="polite">
                        {isOnline ? "Online" : "Offline"}
                    </p>
                </div>
            </div>
            <div className="text-neutral-400 dark:text-neutral-500 text-sm">
                Direct message
            </div>
        </header>
    );
}
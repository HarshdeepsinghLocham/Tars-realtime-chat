"use client";

import { motion } from "framer-motion";
import { Trash2 } from "lucide-react";
import { formatMessageTime } from "@/lib/utils";

export const REACTION_EMOJIS = ["👍", "❤️", "😂", "😮", "😢"] as const;

export interface ChatBubbleMessage {
    _id: string;
    content: string;
    senderId: string;
    _creationTime: number;
    deleted?: boolean;
}

interface ChatBubbleProps {
    message: ChatBubbleMessage;
    isOwn: boolean;
    showAvatar: boolean;
    isFirstInGroup: boolean;
    isSending?: boolean;
    avatarInitial?: string;
    onDelete?: (messageId: string) => void;
    messageId?: string;
    reactionCounts?: Record<string, number>;
    currentUserReactions?: Set<string>;
    onToggleReaction?: (messageId: string, emoji: string) => void;
}

export default function ChatBubble({
    message,
    isOwn,
    showAvatar,
    isFirstInGroup,
    isSending = false,
    avatarInitial,
    onDelete,
    messageId,
    reactionCounts,
    onToggleReaction,
}: ChatBubbleProps) {
    const canDelete =
        isOwn && !message.deleted && !isSending && onDelete && messageId;

    const hasReactions =
        reactionCounts && Object.values(reactionCounts).some((c) => c > 0);

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: isSending ? 0.7 : 1, y: 0 }}
            transition={{ duration: 0.18 }}
            className={`flex gap-2 items-end ${isOwn ? "flex-row-reverse" : "flex-row"
                } ${isFirstInGroup ? "mt-3" : "mt-1"} group`}
        >
            {/* Avatar */}
            {!isOwn && (
                <div className="w-8 h-8 shrink-0 rounded-full bg-neutral-700 flex items-center justify-center text-xs text-neutral-300">
                    {showAvatar ? avatarInitial?.slice(0, 1).toUpperCase() : ""}
                </div>
            )}

            {/* Message Column */}
            <div
                className={`flex flex-col max-w-[70%] ${isOwn ? "items-end" : "items-start"
                    }`}
            >
                {/* Bubble Wrapper (relative for reactions) */}
                <div className="relative">
                    {/* Bubble */}
                    <div
                        className={`px-3 py-2 text-sm rounded-xl relative ${isOwn
                                ? "bg-neutral-100 text-neutral-900 rounded-br-md"
                                : "bg-neutral-800 text-neutral-100 rounded-bl-md"
                            }`}
                    >
                        {message.deleted ? (
                            <span className="italic text-neutral-400">
                                This message was deleted
                            </span>
                        ) : (
                            message.content
                        )}

                        {/* Delete Button */}
                        {canDelete && (
                            <button
                                onClick={() => onDelete!(messageId!)}
                                className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 transition bg-neutral-700 text-white p-1 rounded-full"
                            >
                                <Trash2 size={12} />
                            </button>
                        )}
                    </div>

                    {/* Reaction Summary (WhatsApp Style) */}
                    {hasReactions && (
                        <div
                            className={`absolute -bottom-3 ${isOwn ? "right-2" : "left-2"
                                } flex gap-1 bg-neutral-900/90 backdrop-blur-sm border border-neutral-700/50 text-xs px-2 py-0.5 rounded-full shadow-sm`}
                        >
                            {Object.entries(reactionCounts!)
                                .filter(([_, count]) => count > 0)
                                .map(([emoji, count]) => (
                                    <span key={emoji} className="flex items-center gap-0.5">
                                        {emoji}
                                        {count > 1 && <span>{count}</span>}
                                    </span>
                                ))}
                        </div>
                    )}

                    {/* Reaction Picker (On Hover Only) */}
                    {onToggleReaction && messageId && !message.deleted && (
                        <div
                            className={`absolute ${isOwn ? "-left-2" : "-right-2"
                                } -top-10 opacity-0 group-hover:opacity-100 transition-all duration-150 bg-neutral-900 border border-neutral-700 rounded-full px-2 py-1 flex gap-1 shadow-md`}
                        >
                            {REACTION_EMOJIS.map((emoji) => (
                                <button
                                    key={emoji}
                                    onClick={() => onToggleReaction(messageId, emoji)}
                                    className="hover:scale-110 transition-transform text-sm"
                                >
                                    {emoji}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Timestamp */}
                <span
                    className={`text-[11px] text-neutral-500 mt-1 ${isOwn ? "text-right" : "text-left"
                        }`}
                >
                    {formatMessageTime(message._creationTime)}
                    {isSending && <span className="ml-1">· Sending…</span>}
                </span>
            </div>

            {isOwn && <div className="w-8 shrink-0" />}
        </motion.div>
    );
}
"use client";

import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import ChatBubble, { type ChatBubbleMessage } from "./ChatBubble";
import type { Doc, Id } from "../../../convex/_generated/dataModel";

const SCROLL_THRESHOLD_PX = 80;

export type MessageWithMeta = Doc<"messages"> & { _creationTime: number };
export type OptimisticMessage = {
    tempId: string;
    content: string;
    senderId: Id<"users">;
    _creationTime: number;
    isSending: true;
};

interface MessageListProps {
    messages: MessageWithMeta[] | undefined;
    optimisticMessages: OptimisticMessage[];
    currentUserId: Id<"users"> | null;
    otherUserName?: string;
    onDeleteMessage?: (messageId: Id<"messages">) => void;
    onToggleReaction?: (messageId: Id<"messages">, emoji: string) => void;
}

function toBubbleMessage(m: MessageWithMeta | OptimisticMessage): ChatBubbleMessage {
    return {
        _id: "_id" in m ? m._id : m.tempId,
        content: m.content,
        senderId: m.senderId,
        _creationTime: m._creationTime,
        deleted: "_id" in m && "deleted" in m ? (m as MessageWithMeta).deleted : undefined,
    };
}

export default function MessageList({
    messages,
    optimisticMessages,
    currentUserId,
    otherUserName,
    onDeleteMessage,
    onToggleReaction,
}: MessageListProps) {
    const scrollRef = useRef<HTMLDivElement>(null);
    const prevLengthRef = useRef(0);
    const [showNewMessagesButton, setShowNewMessagesButton] = useState(false);
    const userScrolledRef = useRef(false);

    const list: (MessageWithMeta | OptimisticMessage)[] = [
        ...(messages ?? []),
        ...optimisticMessages,
    ].sort((a, b) => a._creationTime - b._creationTime);

    const messageIds = useMemo(
        () => list.filter((m): m is MessageWithMeta => "_id" in m && !("tempId" in m)).map((m) => m._id),
        [list]
    );
    const reactionsMap = useQuery(
        api.reactions.getReactionsForMessageIds,
        messageIds.length > 0 ? { messageIds } : "skip"
    );
    const getReactionsForMessage = useCallback(
        (id: string) => {
            if (!reactionsMap || !currentUserId) return { counts: {} as Record<string, number>, currentUser: new Set<string>() };
            const data = reactionsMap[id as Id<"messages">];
            if (!data) return { counts: {} as Record<string, number>, currentUser: new Set<string>() };
            const counts = (data.counts ?? []).reduce((acc, { emoji, count }) => ({ ...acc, [emoji]: count }), {} as Record<string, number>);
            const currentUser = new Set(data.list.filter((r) => r.userId === currentUserId).map((r) => r.emoji));
            return { counts, currentUser };
        },
        [reactionsMap, currentUserId]
    );

    const scrollToBottom = useCallback(() => {
        const container = scrollRef.current;
        if (!container) return;
        container.scrollTo({ top: container.scrollHeight, behavior: "smooth" });
        setShowNewMessagesButton(false);
    }, []);

    useEffect(() => {
        const container = scrollRef.current;
        if (!container) return;
        const prevLen = prevLengthRef.current;
        const newLen = list.length;
        const newMessageArrived = newLen > prevLen;
        prevLengthRef.current = newLen;

        if (newLen > 0 && prevLen === 0) {
            requestAnimationFrame(() => scrollToBottom());
            return;
        }
        if (!newMessageArrived) return;

        const atBottom =
            container.scrollHeight - container.scrollTop - container.clientHeight < SCROLL_THRESHOLD_PX;
        if (atBottom || !userScrolledRef.current) {
            requestAnimationFrame(() => scrollToBottom());
        } else {
            setShowNewMessagesButton(true);
        }
    }, [list.length, scrollToBottom]);

    const handleScroll = useCallback(() => {
        const container = scrollRef.current;
        if (!container) return;
        const atBottom =
            container.scrollHeight - container.scrollTop - container.clientHeight < SCROLL_THRESHOLD_PX;
        if (atBottom) {
            setShowNewMessagesButton(false);
            userScrolledRef.current = false;
        } else {
            userScrolledRef.current = true;
        }
    }, []);

    const grouped = list.map((msg, i) => {
        const next = list[i + 1];
        const prev = list[i - 1];
        const sameNext = next && (next as { senderId: string }).senderId === (msg as { senderId: string }).senderId;
        const samePrev = prev && (prev as { senderId: string }).senderId === (msg as { senderId: string }).senderId;
        return {
            msg,
            isFirstInGroup: !samePrev,
            isLastInGroup: !sameNext,
            showAvatar: !samePrev,
        };
    });

    const isEmpty = grouped.length === 0;

    return (
        <div className="flex-1 min-h-0 flex flex-col relative">
            <div
                ref={scrollRef}
                onScroll={handleScroll}
                className="flex-1 overflow-y-auto overflow-x-hidden flex flex-col scroll-smooth"
                role="log"
                aria-live="polite"
                aria-label="Message list"
            >
                <div className={`min-h-full flex flex-col py-4 px-2 ${isEmpty ? "justify-center" : "justify-end"}`}>
                    <div className="flex flex-col justify-end">
                        {isEmpty ? (
                            <p className="text-center text-neutral-400 dark:text-neutral-500 text-sm">
                                Start a conversation
                            </p>
                        ) : (
                            <AnimatePresence initial={false}>
                                {grouped.map(({ msg, isFirstInGroup, showAvatar }) => {
                                    const isOptimistic = "tempId" in msg && msg.isSending;
                                    const bubble = toBubbleMessage(msg);
                                    const isOwn = currentUserId != null && msg.senderId === currentUserId;
                                    const msgId = "_id" in msg ? (msg as MessageWithMeta)._id : undefined;
                                    const { counts, currentUser } = msgId ? getReactionsForMessage(msgId) : { counts: {} as Record<string, number>, currentUser: new Set<string>() };
                                    return (
                                        <ChatBubble
                                            key={bubble._id}
                                            message={bubble}
                                            isOwn={isOwn}
                                            showAvatar={showAvatar && !isOwn}
                                            isFirstInGroup={isFirstInGroup}

                                            isSending={isOptimistic}
                                            avatarInitial={!isOwn ? otherUserName : undefined}
                                            onDelete={onDeleteMessage ? () => msgId && onDeleteMessage(msgId) : undefined}
                                            messageId={msgId}
                                            reactionCounts={counts}
                                            currentUserReactions={currentUser}
                                            onToggleReaction={onToggleReaction ? (id, emoji) => onToggleReaction(id as Id<"messages">, emoji) : undefined}

                                        />
                                    );
                                })}
                            </AnimatePresence>
                        )}
                    </div>
                </div>
            </div>
            {showNewMessagesButton && (
                <button
                    type="button"
                    onClick={scrollToBottom}
                    className="absolute bottom-4 left-1/2 -translate-x-1/2 px-3 py-2 rounded-full bg-neutral-800 dark:bg-neutral-200 text-neutral-100 dark:text-neutral-800 text-xs font-medium hover:bg-neutral-700 dark:hover:bg-neutral-300 transition-colors duration-150"
                >
                    ↓ New messages
                </button>
            )}
        </div>
    );
}

"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Doc, Id } from "../../../convex/_generated/dataModel";
import { conversationRoom, ONLINE_ROOM } from "@/lib/presence-rooms";
import ChatHeader from "@/components/chat/ChatHeader";
import MessageList from "@/components/chat/MessageList";
import type { OptimisticMessage } from "@/components/chat/MessageList";
import MessageInput from "@/components/chat/MessageInput";
import TypingIndicator from "@/components/chat/TypingIndicator";
import type { UserGroupWithMeta } from "@/types/groups";

const HEARTBEAT_MS = 15_000;

type SelectedConversation =
    | { type: "dm"; id: Id<"users"> }
    | { type: "group"; id: Id<"groups"> }
    | null;

interface RightPanelProps {
    selectedConversation: SelectedConversation;
    selectedUserData: Doc<"users"> | undefined;
    selectedGroupData: UserGroupWithMeta | undefined;
    messages: (Doc<"messages"> & { _creationTime: number })[] | undefined;
    currentUserId: Id<"users"> | null;
    onSend: (content: string) => void | Promise<unknown>;
}

export default function RightPanel({
    selectedConversation,
    selectedUserData,
    selectedGroupData,
    messages,
    currentUserId,
    onSend,
}: RightPanelProps) {
    const [optimisticMessages, setOptimisticMessages] = useState<OptimisticMessage[]>([]);
    const [sendError, setSendError] = useState<string | null>(null);
    const [pendingRetry, setPendingRetry] = useState<string | null>(null);
    const updatePresence = useMutation(api.presence.updatePresence);
    const deleteMessage = useMutation(api.messages.deleteMessage);
    const markRead = useMutation(api.readReceipts.markRead);
    const toggleReaction = useMutation(api.reactions.toggleReaction);
    const convRoom =
        selectedConversation?.type === "dm" && currentUserId
            ? conversationRoom(currentUserId, selectedConversation.id)
            : null;
    const presenceInRoom = useQuery(
        api.presence.getPresence,
        convRoom ? { room: convRoom } : "skip"
    );
    const onlinePresence = useQuery(
        api.presence.getPresence,
        { room: ONLINE_ROOM }
    );
    const othersTyping = presenceInRoom?.filter((p) => p.userId !== currentUserId && p.typing) ?? [];
    const typingName = othersTyping.length > 0 && selectedUserData ? selectedUserData.name : null;
    const isSelectedUserOnline =
        selectedConversation?.type === "dm"
            ? onlinePresence?.some(
                (p) => p.userId === selectedConversation.id
            ) ?? false
            : false;

    const heartbeatRef = useRef<ReturnType<typeof setInterval> | null>(null);

    useEffect(() => {
        if (!currentUserId) return;
        const beat = () => {
            updatePresence({ room: ONLINE_ROOM, userId: currentUserId });
        };
        beat();
        heartbeatRef.current = setInterval(beat, HEARTBEAT_MS);
        return () => {
            if (heartbeatRef.current) clearInterval(heartbeatRef.current);
        };
    }, [currentUserId, updatePresence]);

    useEffect(() => {
        if (!convRoom || !currentUserId) return;
        updatePresence({ room: convRoom, userId: currentUserId });
    }, [convRoom, currentUserId, updatePresence]);

    useEffect(() => {
        if (
            currentUserId &&
            selectedConversation?.type === "dm"
        ) {
            markRead({
                userId: currentUserId,
                peerId: selectedConversation.id,
            });
        }
    }, [currentUserId, selectedConversation, markRead]);

    const handleSend = useCallback(
        async (content: string) => {
            if (!currentUserId) return;
            setSendError(null);
            const tempId = `opt-${Date.now()}-${Math.random().toString(36).slice(2)}`;
            setOptimisticMessages((prev) => [
                ...prev,
                { tempId, content, senderId: currentUserId, _creationTime: Date.now(), isSending: true },
            ]);
            try {
                await Promise.resolve(onSend(content));
            } catch (err) {
                setOptimisticMessages((prev) => prev.filter((o) => o.content !== content));
                setSendError(err instanceof Error ? err.message : "Failed to send");
                setPendingRetry(content);
            }
        },
        [onSend, currentUserId]
    );

    useEffect(() => {
        if (!currentUserId || !messages?.length || !optimisticMessages.length) return;
        const confirmedContents = new Set(
            messages
                .filter((m) => m.senderId === currentUserId)
                .map((m) => m.content)
        );
        setOptimisticMessages((prev) =>
            prev.filter((opt) => !confirmedContents.has(opt.content))
        );
    }, [messages, currentUserId, optimisticMessages.length]);

    const handleTyping = useCallback(
        (typing: boolean) => {
            if (!convRoom || !currentUserId) return;
            updatePresence({
                room: convRoom,
                userId: currentUserId,
                typing,
            });
        },
        [convRoom, currentUserId, updatePresence]
    );

    return (
        <div className="flex-1 flex flex-col min-w-0 bg-white dark:bg-neutral-900/95">
            <div className="px-4 py-4 border-b border-neutral-200 dark:border-neutral-600/80">
                <ChatHeader
                    selectedUserData={selectedUserData}
                    selectedGroupData={selectedGroupData}
                    isOnline={isSelectedUserOnline}
                />
            </div>

            <div className="flex-1 flex flex-col overflow-hidden px-4 min-h-0">
                {selectedConversation ? (
                    <>
                        <MessageList
                            messages={messages}
                            optimisticMessages={optimisticMessages}
                            currentUserId={currentUserId}
                            otherUserName={selectedGroupData ? selectedGroupData.name : selectedUserData?.name}
                            onDeleteMessage={(id) => currentUserId && deleteMessage({ messageId: id, userId: currentUserId })}
                            onToggleReaction={(messageId, emoji) => currentUserId && toggleReaction({ messageId, userId: currentUserId, emoji })}
                        />
                        {typingName && (
                            <TypingIndicator label={typingName} />
                        )}
                        {sendError && (
                            <div className="flex items-center justify-between gap-2 px-2 py-1.5 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 text-sm">
                                <span>{sendError}</span>
                                {pendingRetry && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            handleSend(pendingRetry);
                                            setPendingRetry(null);
                                        }}
                                        className="px-2 py-1 rounded bg-red-200 dark:bg-red-800/50 hover:bg-red-300 dark:hover:bg-red-800 text-sm font-medium"
                                    >
                                        Retry
                                    </button>
                                )}
                            </div>
                        )}
                        <MessageInput onSend={handleSend} onTyping={handleTyping} />
                    </>
                ) : (
                    <div className="flex-1 flex items-center justify-center text-neutral-400 dark:text-neutral-500 text-sm">
                        Select a conversation
                    </div>
                )}
            </div>
        </div>
    );
}

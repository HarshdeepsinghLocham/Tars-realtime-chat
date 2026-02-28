"use client";

import { useState } from "react";
import type { Doc, Id } from "../../../convex/_generated/dataModel";
import LeftPanel from "./LeftPanel";
import RightPanel from "./RightPanel";
import { ArrowLeft } from "lucide-react";
import type { UserGroupWithMeta } from "@/types/groups";

type SelectedConversation =
    | { type: "dm"; id: Id<"users"> }
    | { type: "group"; id: Id<"groups"> }
    | null;

interface ChatLayoutProps {
    currentUser: Doc<"users"> | null;
    users: Doc<"users">[] | undefined;
    selectedConversation: SelectedConversation;
    onSelectConversation: (c: SelectedConversation) => void;
    messages:
    | (Doc<"messages"> & { _creationTime: number; deleted?: boolean })[]
    | undefined;
    sendMessage: (args: {
        senderId: Id<"users">;
        receiverId: Id<"users">;
        content: string;
    }) => Promise<unknown>;
    sendGroupMessage: (args: {
        groupId: Id<"groups">;
        senderId: Id<"users">;
        content: string;
    }) => Promise<unknown>;
    groups: UserGroupWithMeta[] | undefined;
}

export default function ChatLayout({
    currentUser,
    users,
    selectedConversation,
    onSelectConversation,
    messages,
    sendMessage,
    sendGroupMessage,
    groups,
}: ChatLayoutProps) {
    const [mobileChatOpen, setMobileChatOpen] = useState(false);

    const handleSelectConversation = (conversation: SelectedConversation) => {
        onSelectConversation(conversation);
        setMobileChatOpen(true);
    };

    const handleSend = async (content: string) => {
        if (!currentUser || !selectedConversation) return;

        if (selectedConversation.type === "dm") {
            await sendMessage({
                senderId: currentUser._id,
                receiverId: selectedConversation.id,
                content,
            });
        }

        if (selectedConversation.type === "group") {
            await sendGroupMessage({
                groupId: selectedConversation.id,
                senderId: currentUser._id,
                content,
            });
        }
    };

    return (
        <div className="h-screen bg-neutral-100 dark:bg-neutral-950 flex flex-col md:flex-row md:items-center md:justify-center">
            <div className="w-full md:w-275 max-w-full h-full md:max-h-[90vh] md:h-[90vh] bg-white dark:bg-neutral-900 md:rounded-xl border-0 md:border border-neutral-200 dark:border-neutral-700 flex overflow-hidden shadow-lg dark:shadow-none flex-col md:flex-row">
                <div
                    className={`flex flex-col flex- min-h-0 md:flex-row md:min-w-0 md:shrink-0 ${mobileChatOpen ? "hidden md:flex" : "flex"
                        }`}
                >
                    <LeftPanel
                        currentUserId={currentUser?._id ?? null}
                        currentUser={currentUser}
                        selectedConversation={selectedConversation}
                        onSelectConversation={handleSelectConversation}
                        groups={groups}
                    />
                </div>
                <div
                    className={`flex flex-col flex-1 min-h-0 min-w-0 ${mobileChatOpen ? "flex" : "hidden md:flex"
                        }`}
                >
                    {mobileChatOpen && (
                        <button
                            type="button"
                            onClick={() => setMobileChatOpen(false)}
                            className="md:hidden flex items-center gap-2 px-3 py-2 border-b border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-200"
                            aria-label="Back to conversations"
                        >
                            <ArrowLeft size={20} />
                            Back
                        </button>
                    )}
                    <RightPanel
                        selectedConversation={selectedConversation}
                        selectedUserData={
                            selectedConversation?.type === "dm"
                                ? users?.find(u => u._id === selectedConversation.id)
                                : undefined
                        }
                        selectedGroupData={
                            selectedConversation?.type === "group"
                                ? groups?.find(g => g._id === selectedConversation.id)
                                : undefined
                        }
                        messages={messages}
                        currentUserId={currentUser?._id ?? null}
                        onSend={handleSend}
                    />
                </div>
            </div>
        </div>
    );
}

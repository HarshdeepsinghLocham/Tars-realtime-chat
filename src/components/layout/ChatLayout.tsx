"use client";

import { useState } from "react";
import type { Doc, Id } from "../../../convex/_generated/dataModel";
import LeftPanel from "./LeftPanel";
import RightPanel from "./RightPanel";
import { ArrowLeft } from "lucide-react";
import type { UserGroupWithMeta } from "../../../convex/groups";

type SelectedConversation =
    | { type: "dm"; id: Id<"users"> }
    | { type: "group"; id: Id<"groups"> }
    | null;

interface ChatLayoutProps {
    currentUser: Doc<"users"> | null;
    isCurrentUserLoading?: boolean;
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
        content: string;
    }) => Promise<unknown>;
    groups: UserGroupWithMeta[] | undefined;
}

export default function ChatLayout({
    currentUser,
    isCurrentUserLoading = false,
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
                content,
            });
        }
    };

    return (
        <div className="h-dvh flex bg-neutral-100 dark:bg-neutral-950 ">
            <div className="flex flex-1 min-h-0 bg-white dark:bg-neutral-900">

                {/* LEFT PANEL */}
                <div
                    className={`flex flex-col w-75 border-r border-neutral-200 dark:border-neutral-700 ${mobileChatOpen ? "hidden md:flex" : "flex"
                        }`}
                >
                    <LeftPanel
                        currentUserId={currentUser?._id ?? null}
                        currentUser={currentUser}
                        isCurrentUserLoading={isCurrentUserLoading}
                        selectedConversation={selectedConversation}
                        onSelectConversation={handleSelectConversation}
                        groups={groups}
                    />
                </div>

                {/* RIGHT PANEL */}
                <div
                    className={`flex flex-col flex-1 min-h-0 ${mobileChatOpen ? "flex" : "hidden md:flex"
                        }`}
                >
                    {mobileChatOpen && (
                        <button
                            onClick={() => setMobileChatOpen(false)}
                            className="md:hidden flex items-center gap-2 px-3 py-2 border-b border-neutral-200 dark:border-neutral-700"
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
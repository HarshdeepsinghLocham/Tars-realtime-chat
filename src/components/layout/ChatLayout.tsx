"use client";

import { useState } from "react";
import type { Doc, Id } from "../../../convex/_generated/dataModel";
import LeftPanel from "./LeftPanel";
import RightPanel from "./RightPanel";
import { ArrowLeft } from "lucide-react";

interface ChatLayoutProps {
    currentUser: Doc<"users"> | null;
    users: Doc<"users">[] | undefined;
    selectedUser: Id<"users"> | null;
    setSelectedUser: (id: Id<"users"> | null) => void;
    messages: (Doc<"messages"> & { _creationTime: number; deleted?: boolean })[] | undefined;
    sendMessage: (args: { senderId: Id<"users">; receiverId: Id<"users">; content: string }) => Promise<unknown>;
    selectedGroupId: Id<"groups"> | null;
    setSelectedGroupId: (id: Id<"groups"> | null) => void;
    groupMessages: (Doc<"messages"> & { _creationTime: number; deleted?: boolean })[] | undefined;
    sendGroupMessage: (args: { groupId: Id<"groups">; senderId: Id<"users">; content: string }) => Promise<unknown>;
    groups: Doc<"groups">[] | undefined;
}

export default function ChatLayout({
    currentUser,
    users,
    selectedUser,
    setSelectedUser,
    messages,
    sendMessage,
    selectedGroupId,
    setSelectedGroupId,
    groupMessages,
    sendGroupMessage,
    groups,
}: ChatLayoutProps) {
    const [mobileChatOpen, setMobileChatOpen] = useState(false);

    const handleSelectUser = (id: Id<"users">) => {
        setSelectedUser(id);
        setSelectedGroupId(null);
        setMobileChatOpen(true);
    };

    const handleSelectGroup = (id: Id<"groups">) => {
        setSelectedGroupId(id);
        setSelectedUser(null);
        setMobileChatOpen(true);
    };

    const handleSend = async (content: string) => {
        if (!currentUser) return;

        if (selectedUser) {
            await sendMessage({
                senderId: currentUser._id,
                receiverId: selectedUser,
                content,
            });
        } else if (selectedGroupId) {
            await sendGroupMessage({
                groupId: selectedGroupId,
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
                        selectedUser={selectedUser}
                        selectedGroupId={selectedGroupId}
                        groups={groups}
                        onSelectUser={handleSelectUser}
                        onSelectGroup={handleSelectGroup}
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
                        selectedUser={selectedUser}
                        selectedUserData={users?.find((u) => u._id === selectedUser)}
                        selectedGroupId={selectedGroupId}
                        selectedGroupData={groups?.find((g) => g._id === selectedGroupId)}
                        messages={selectedGroupId ? groupMessages : messages}
                        currentUserId={currentUser?._id ?? null}
                        onSend={handleSend}
                    />
                </div>
            </div>
        </div>
    );
}

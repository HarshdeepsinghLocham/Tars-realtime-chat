// LeftPanel.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useClerk } from "@clerk/nextjs";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { ONLINE_ROOM } from "@/lib/presence-rooms";
import type { Doc, Id } from "../../../convex/_generated/dataModel";
import type { UserGroupWithMeta } from "../../../convex/groups";

import LeftPanelHeader from "./LeftPanelHeader";
import ConversationSearch from "./ConversationSearch";
import ConversationList from "./ConversationList";
import CreateGroupDialog from "@/components/groups/CreateGroupDialog";

type SelectedConversation =
    | { type: "dm"; id: Id<"users"> }
    | { type: "group"; id: Id<"groups"> }
    | null;

interface Props {
    currentUserId: Id<"users"> | null;
    currentUser: Doc<"users"> | null;
    isCurrentUserLoading?: boolean;
    selectedConversation: SelectedConversation;
    groups: UserGroupWithMeta[] | undefined;
    onSelectConversation: (c: SelectedConversation) => void;
}

export default function LeftPanel({
    currentUserId,
    currentUser,
    isCurrentUserLoading = false,
    selectedConversation,
    groups,
    onSelectConversation,
}: Props) {
    const { signOut } = useClerk();

    const [search, setSearch] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

    const previews = useQuery(
        api.messages.getConversationPreviews,
        currentUserId ? { currentUserId } : "skip"
    );

    const markRead = useMutation(api.readReceipts.markRead);

    const onlinePresence = useQuery(api.presence.getPresence, {
        room: ONLINE_ROOM,
    });

    const onlineSet = useMemo(
        () => new Set(onlinePresence?.map((p) => p.userId) ?? []),
        [onlinePresence]
    );
    const createGroup = useMutation(api.groups.createGroup);

    useEffect(() => {
        const t = setTimeout(() => {
            setDebouncedSearch(search.trim());
        }, 250);
        return () => clearTimeout(t);
    }, [search]);

    const filteredDMs = useMemo(() => {
        if (!previews) return [];
        const term = debouncedSearch.toLowerCase();

        return previews.filter(
            (p) => !term || p.otherUser.name.toLowerCase().includes(term)
        );
    }, [previews, debouncedSearch]);

    return (
        <aside className="w-full md:w-75 border-r border-neutral-200 dark:border-neutral-700 bg-neutral-50/80 dark:bg-neutral-900/50 flex flex-col shrink-0">
            <LeftPanelHeader
                currentUser={currentUser}
                onOpenCreate={() => setIsCreateDialogOpen(true)}
                onSignOut={signOut}
            />

            <ConversationSearch value={search} onChange={setSearch} />

            <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
                {isCurrentUserLoading && (
                    <div className="py-2 px-3 text-center text-sm text-neutral-500 dark:text-neutral-400 shrink-0">
                        Loading conversations…
                    </div>
                )}
                <ConversationList
                    selectedConversation={selectedConversation}
                    dms={filteredDMs}
                    groups={groups ?? []}
                    onlineSet={onlineSet}
                    currentUserId={currentUserId}
                    onSelectConversation={onSelectConversation}
                    onMarkRead={markRead}
                />
            </div>

            <CreateGroupDialog
                open={isCreateDialogOpen}
                onOpenChange={setIsCreateDialogOpen}
                currentUserId={currentUserId}
                users={filteredDMs.map((p) => p.otherUser)}
                onCreate={async ({ name, memberIds, image }) => {
                    if (!currentUserId) return;
                    const groupId = await createGroup({
                        name,
                        memberIds,
                        image,
                    });
                    onSelectConversation({
                        type: "group",
                        id: groupId,
                    });
                    setIsCreateDialogOpen(false);
                }}
            />
        </aside>
    );
}
"use client";

import { useEffect, useMemo, useState } from "react";
import { Search, LogOut, Plus } from "lucide-react";
import { useClerk, UserButton } from "@clerk/nextjs";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { ONLINE_ROOM } from "@/lib/presence-rooms";
import type { Doc } from "../../../convex/_generated/dataModel";
import { Id } from "../../../convex/_generated/dataModel";
import { formatMessageTime } from "@/lib/utils";
import ThemeToggle from "@/components/theme/ThemeToggle";

const PREVIEW_MAX_LENGTH = 36;

function truncatePreview(text: string): string {
    if (text.length <= PREVIEW_MAX_LENGTH) return text;
    return text.slice(0, PREVIEW_MAX_LENGTH).trim() + "…";
}

interface LeftPanelProps {
    currentUserId: Id<"users"> | null;
    currentUser: Doc<"users"> | null;
    selectedUser: Id<"users"> | null;
    selectedGroupId: Id<"groups"> | null;
    groups: Doc<"groups">[] | undefined;
    onSelectUser: (id: Id<"users">) => void;
    onSelectGroup: (id: Id<"groups">) => void;
}

export default function LeftPanel({
    currentUserId,
    currentUser,
    selectedUser,
    selectedGroupId,
    groups,
    onSelectUser,
    onSelectGroup,
}: LeftPanelProps) {
    const { signOut } = useClerk();
    const [search, setSearch] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [showGroupForm, setShowGroupForm] = useState(false);
    const [groupName, setGroupName] = useState("");
    const [selectedMemberIds, setSelectedMemberIds] = useState<Id<"users">[]>([]);

    const previews = useQuery(
        api.messages.getConversationPreviews,
        currentUserId ? { currentUserId } : "skip"
    );
    const markRead = useMutation(api.readReceipts.markRead);
    const onlinePresence = useQuery(api.presence.getPresence, { room: ONLINE_ROOM });
    const onlineSet = useMemo(
        () => new Set(onlinePresence?.map((p) => p.userId) ?? []),
        [onlinePresence]
    );
    const createGroup = useMutation(api.groups.createGroup);

    useEffect(() => {
        const handler = setTimeout(() => setDebouncedSearch(search.trim()), 250);
        return () => clearTimeout(handler);
    }, [search]);

    const filtered = useMemo(() => {
        if (!previews) return [];
        const term = debouncedSearch.toLowerCase();
        return previews.filter(
            (p) => !term || p.otherUser.name.toLowerCase().includes(term)
        );
    }, [previews, debouncedSearch]);

    const allOtherUsers = useMemo(
        () => previews?.map((p) => p.otherUser) ?? [],
        [previews]
    );

    const toggleMember = (id: Id<"users">) => {
        setSelectedMemberIds((prev) =>
            prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id]
        );
    };

    const handleCreateGroup = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentUserId) return;
        const name = groupName.trim();
        if (!name) return;
        try {
            const groupId = await createGroup({
                name,
                createdBy: currentUserId,
                memberIds: selectedMemberIds,
            });
            setGroupName("");
            setSelectedMemberIds([]);
            setShowGroupForm(false);
            onSelectGroup(groupId as Id<"groups">);
        } catch (err) {
            // Swallow error for now; could show toast in future
            console.error(err);
        }
    };

    return (
        <aside
            className="w-full md:w-75 border-r border-neutral-200 dark:border-neutral-700 bg-neutral-50/80 dark:bg-neutral-900/50 flex flex-col shrink-0"
            role="complementary"
            aria-label="Conversations"
        >
            <div className="px-3 py-4 border-b border-neutral-200 dark:border-neutral-700">
                <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                        <UserButton />
                        <span className="text-sm font-semibold text-neutral-800 dark:text-neutral-200 truncate">
                            {currentUser?.name ?? "Messages"}
                        </span>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                        <ThemeToggle />
                        <button
                            type="button"
                            onClick={() => signOut()}
                            className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-200/80 dark:hover:bg-neutral-700/80 transition-colors focus:outline-none focus:ring-2 focus:ring-neutral-300 dark:focus:ring-neutral-500"
                            aria-label="Sign out"
                        >
                            <LogOut size={16} />
                        </button>
                    </div>
                </div>
            </div>

            <div className="px-3 py-2 border-b border-neutral-200 dark:border-neutral-700">
                <div className="relative">
                    <Search
                        size={14}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 dark:text-neutral-500 pointer-events-none"
                        aria-hidden
                    />
                    <input
                        type="search"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search"
                        className="w-full pl-8 pr-3 py-2 text-sm bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-600 rounded-lg placeholder:text-neutral-400 dark:placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-neutral-300 dark:focus:ring-neutral-500 focus:border-transparent text-neutral-900 dark:text-neutral-100"
                        aria-label="Search conversations"
                    />
                </div>
            </div>

            <div className="flex-1 overflow-y-auto min-h-0 py-1">
                {currentUserId && !previews && (
                    <p className="text-center text-neutral-400 dark:text-neutral-500 text-xs py-6">
                        Loading…
                    </p>
                )}
                {currentUserId && previews && filtered.length === 0 && (
                    <p className="text-center text-neutral-400 dark:text-neutral-500 text-xs py-6">
                        {debouncedSearch ? "No matches" : "No conversations yet"}
                    </p>
                )}
                {filtered.map(({ otherUser, lastMessage, unreadCount }) => {
                    const isSelected = selectedUser === otherUser._id && !selectedGroupId;
                    const isOnline = onlineSet.has(otherUser._id);
                    const isUnread = (unreadCount ?? 0) > 0 && !isSelected;
                    return (
                        <button
                            type="button"
                            key={otherUser._id}
                            onClick={() => {
                                onSelectUser(otherUser._id);
                                if (currentUserId) markRead({ userId: currentUserId, peerId: otherUser._id });
                            }}
                            className={`w-full text-left px-2 py-2 rounded-lg mx-1 transition-[background-color,border-color] duration-150 ease-out focus:outline-none focus:ring-2 focus:ring-neutral-300 dark:focus:ring-neutral-500 focus:ring-offset-1 dark:focus:ring-offset-neutral-900 ${isSelected
                                ? "bg-neutral-100 dark:bg-neutral-700 border border-neutral-200 dark:border-neutral-500"
                                : "hover:bg-neutral-100/80 dark:hover:bg-neutral-800/40 border border-transparent"
                                }`}
                        >
                            <div className="flex items-start gap-2">
                                <div className="relative shrink-0">
                                    <img
                                        src={otherUser.image}
                                        alt=""
                                        className="w-9 h-9 rounded-full object-cover"
                                    />
                                    <span
                                        className={`absolute bottom-0 right-0 w-2 h-2 rounded-full border-2 border-neutral-50 dark:border-neutral-900 ${isOnline ? "bg-emerald-500" : "bg-neutral-300 dark:bg-neutral-600"
                                            }`}
                                        aria-hidden
                                    />
                                </div>
                                <div className="min-w-0 flex-1 relative">
                                    <p
                                        className={`text-sm truncate pr-8 ${isSelected
                                            ? "font-semibold text-neutral-900 dark:text-neutral-100"
                                            : isUnread
                                                ? "font-semibold text-neutral-900 dark:text-neutral-100"
                                                : "font-medium text-neutral-800 dark:text-neutral-200"
                                            }`}
                                    >
                                        {otherUser.name}
                                    </p>
                                    {(unreadCount ?? 0) > 0 && (
                                        <span className="absolute top-0 right-0 min-w-4.5 h-4.5 px-1 rounded-full bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 text-xs font-medium flex items-center justify-center">
                                            {unreadCount > 99 ? "99+" : unreadCount}
                                        </span>
                                    )}
                                    {lastMessage ? (
                                        <>
                                            <p className="text-xs text-neutral-400 dark:text-neutral-500 truncate mt-0.5">
                                                {truncatePreview(lastMessage.content)}
                                            </p>
                                            <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-0.5">
                                                {formatMessageTime(lastMessage._creationTime)}
                                            </p>
                                        </>
                                    ) : (
                                        <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-0.5">
                                            No messages yet
                                        </p>
                                    )}
                                </div>
                            </div>
                        </button>
                    );
                })}
            </div>

            <div className="border-t border-neutral-200 dark:border-neutral-700 px-3 py-2">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
                        Groups
                    </span>
                    <button
                        type="button"
                        onClick={() => setShowGroupForm((prev) => !prev)}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium border border-neutral-200 dark:border-neutral-600 text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 focus:outline-none focus:ring-1 focus:ring-neutral-300 dark:focus:ring-neutral-500"
                    >
                        <Plus size={12} />
                        New
                    </button>
                </div>

                {showGroupForm && (
                    <form onSubmit={handleCreateGroup} className="mb-2 space-y-2">
                        <input
                            type="text"
                            value={groupName}
                            onChange={(e) => setGroupName(e.target.value)}
                            placeholder="Group name"
                            className="w-full px-2 py-1.5 rounded-md border border-neutral-200 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-xs text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 dark:placeholder:text-neutral-500 focus:outline-none focus:ring-1 focus:ring-neutral-300 dark:focus:ring-neutral-500"
                        />
                        <div className="max-h-32 overflow-y-auto rounded-md border border-neutral-200 dark:border-neutral-600 bg-white/60 dark:bg-neutral-800/60 p-1">
                            {allOtherUsers.length === 0 ? (
                                <p className="text-[11px] text-neutral-400 dark:text-neutral-500 px-1 py-1">
                                    No other users available
                                </p>
                            ) : (
                                allOtherUsers.map((u) => (
                                    <label
                                        key={u._id}
                                        className="flex items-center gap-2 px-1.5 py-1 rounded hover:bg-neutral-100 dark:hover:bg-neutral-700 cursor-pointer"
                                    >
                                        <input
                                            type="checkbox"
                                            className="h-3.5 w-3.5 rounded border-neutral-300 dark:border-neutral-600 text-neutral-900 dark:text-neutral-100"
                                            checked={selectedMemberIds.includes(u._id as Id<"users">)}
                                            onChange={() => toggleMember(u._id as Id<"users">)}
                                        />
                                        <span className="text-xs text-neutral-800 dark:text-neutral-100 truncate">
                                            {u.name}
                                        </span>
                                    </label>
                                ))
                            )}
                        </div>
                        <button
                            type="submit"
                            className="w-full px-2 py-1.5 rounded-md bg-neutral-900 dark:bg-neutral-100 text-[11px] font-semibold text-white dark:text-neutral-900 hover:bg-neutral-800 dark:hover:bg-neutral-200 disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled={!groupName.trim() || !currentUserId}
                        >
                            Create group
                        </button>
                    </form>
                )}

                <div className="space-y-1 max-h-40 overflow-y-auto">
                    {groups && groups.length > 0 ? (
                        groups.map((group) => {
                            const isSelected = selectedGroupId === group._id;
                            return (
                                <button
                                    key={group._id}
                                    type="button"
                                    onClick={() => onSelectGroup(group._id as Id<"groups">)}
                                    className={`w-full text-left px-2 py-1.5 rounded-lg text-xs mx-0 transition-colors ${isSelected
                                        ? "bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900"
                                        : "bg-transparent text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                                        }`}
                                >
                                    <span className="font-medium truncate">
                                        {group.name}
                                    </span>
                                </button>
                            );
                        })
                    ) : (
                        <p className="text-[11px] text-neutral-400 dark:text-neutral-500">
                            No groups yet
                        </p>
                    )}
                </div>
            </div>
        </aside>
    );
}

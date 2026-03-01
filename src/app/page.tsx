"use client";

import { useUser, SignedIn } from "@clerk/nextjs";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useEffect, useState } from "react";
import { Id } from "../../convex/_generated/dataModel";
import ChatLayout from "@/components/layout/ChatLayout";

type SelectedConversation =
  | { type: "dm"; id: Id<"users"> }
  | { type: "group"; id: Id<"groups"> }
  | null;

export default function Home() {
  const { user, isLoaded } = useUser();

  const createUser = useMutation(api.users.createUser);
  const sendMessage = useMutation(api.messages.sendMessage);
  const sendGroupMessage = useMutation(api.groups.sendGroupMessage);

  // Fetch current user from Convex (requires Clerk token to be synced via ConvexProviderWithClerk)
  const currentUser = useQuery(
    api.users.getCurrentUser,
    isLoaded && user ? {} : "skip"
  );
  const users = useQuery(
    api.users.getUsers,
    isLoaded && user ? {} : "skip"
  );

  const [selectedConversation, setSelectedConversation] =
    useState<SelectedConversation>(null);

  // DM Messages
  const messages = useQuery(
    api.messages.getMessages,
    selectedConversation?.type === "dm"
      ? { peerId: selectedConversation.id }
      : "skip"
  );

  // Group Messages
  const groupMessages = useQuery(
    api.groups.getGroupMessages,
    selectedConversation?.type === "group"
      ? { groupId: selectedConversation.id }
      : "skip"
  );

  // Run when we have a Convex user (same gate as DMs list – avoids Unauthorized and keeps lists in sync)
  const groups = useQuery(
    api.groups.getUserGroups,
    isLoaded && user ? {} : "skip"
  );
  // Create user if first login
  useEffect(() => {
    if (user && currentUser === null) {
      createUser({
        clerkId: user.id,
        name: user.fullName || "User",
        image: user.imageUrl,
      });
    }
  }, [user, currentUser, createUser]);

  const isCurrentUserLoading = currentUser === undefined;

  return (
    <SignedIn>
      <ChatLayout
        currentUser={currentUser ?? null}
        isCurrentUserLoading={isCurrentUserLoading}
        users={users}
        selectedConversation={selectedConversation}
        onSelectConversation={setSelectedConversation}
        messages={
          selectedConversation?.type === "group"
            ? groupMessages
            : messages
        }
        sendMessage={sendMessage}
        sendGroupMessage={sendGroupMessage}
        groups={groups}
      />
    </SignedIn>
  );
}
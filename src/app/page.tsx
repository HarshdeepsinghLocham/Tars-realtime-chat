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
  const { user } = useUser();

  const createUser = useMutation(api.users.createUser);
  const sendMessage = useMutation(api.messages.sendMessage);
  const sendGroupMessage = useMutation(api.groups.sendGroupMessage);

  const users = useQuery(api.users.getUsers);

  const [selectedConversation, setSelectedConversation] =
    useState<SelectedConversation>(null);

  const currentUser = users?.find(
    (u) => u.clerkId === user?.id
  );

  // ✅ DM Messages
  const messages = useQuery(
    api.messages.getMessages,
    selectedConversation?.type === "dm" && currentUser
      ? {
        user1: currentUser._id,
        user2: selectedConversation.id,
      }
      : "skip"
  );

  // ✅ Group Messages
  const groupMessages = useQuery(
    api.groups.getGroupMessages,
    selectedConversation?.type === "group"
      ? { groupId: selectedConversation.id }
      : "skip"
  );

  const groups = useQuery(api.groups.getUserGroups,
    currentUser ? { userId: currentUser._id } : "skip"
  );

  useEffect(() => {
    if (user && users) {
      const exists = users.some(u => u.clerkId === user.id);
      if (!exists) {
        createUser({
          clerkId: user.id,
          name: user.fullName || "User",
          image: user.imageUrl,
        });
      }
    }
  }, [user, users, createUser]);

  return (
    <SignedIn>
      <ChatLayout
        currentUser={currentUser ?? null}
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
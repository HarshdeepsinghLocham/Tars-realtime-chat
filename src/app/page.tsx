"use client";

import { useUser } from "@clerk/nextjs";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useEffect, useState } from "react";
import { Id } from "../../convex/_generated/dataModel";
import { SignedIn } from "@clerk/nextjs";
import ChatLayout from "@/components/layout/ChatLayout";

export default function Home() {
  const { user } = useUser();
  const createUser = useMutation(api.users.createUser);
  const sendMessage = useMutation(api.messages.sendMessage);
   const sendGroupMessage = useMutation(api.groups.sendGroupMessage);
  const users = useQuery(api.users.getUsers);

  const [selectedUser, setSelectedUser] =
    useState<Id<"users"> | null>(null);
  const [selectedGroupId, setSelectedGroupId] =
    useState<Id<"groups"> | null>(null);

  const currentUser = users?.find(
    (u) => u.clerkId === user?.id
  );

  const messages = useQuery(
    api.messages.getMessages,
    selectedUser && currentUser
      ? { user1: currentUser._id, user2: selectedUser }
      : "skip"
  );

  const groupMessages = useQuery(
    api.groups.getGroupMessages,
    selectedGroupId
      ? { groupId: selectedGroupId }
      : "skip"
  );

  const groups = useQuery(
    api.groups.getGroupsForUser,
    currentUser ? { userId: currentUser._id } : "skip"
  );

  useEffect(() => {
    if (user) {
      createUser({
        clerkId: user.id,
        name: user.fullName || "User",
        image: user.imageUrl,
      });
    }
  }, [user, createUser]);

  return (
    <>
      <SignedIn>
        <ChatLayout
          currentUser={currentUser ?? null}
          users={users}
          selectedUser={selectedUser}
          setSelectedUser={(id) => {
            setSelectedUser(id);
            setSelectedGroupId(null);
          }}
          selectedGroupId={selectedGroupId}
          setSelectedGroupId={(id) => {
            setSelectedGroupId(id);
            setSelectedUser(null);
          }}
          messages={messages}
          groupMessages={groupMessages}
          sendMessage={sendMessage}
          sendGroupMessage={sendGroupMessage}
          groups={groups}
        />
      </SignedIn>
    </>
  );
}
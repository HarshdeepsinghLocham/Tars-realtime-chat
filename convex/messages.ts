import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const sendMessage = mutation({
    args: {
        senderId: v.id("users"),
        receiverId: v.id("users"),
        content: v.string(),
    },
    handler: async (ctx, args) => {
        await ctx.db.insert("messages", {
            senderId: args.senderId,
            receiverId: args.receiverId,
            content: args.content,
        });
    },
});

export const deleteMessage = mutation({
    args: { messageId: v.id("messages"), userId: v.id("users") },
    handler: async (ctx, args) => {
        const msg = await ctx.db.get(args.messageId);
        if (!msg || msg.senderId !== args.userId) return;
        await ctx.db.patch(args.messageId, { deleted: true });
    },
});

export const getMessages = query({
    args: {
        user1: v.id("users"),
        user2: v.id("users"),
    },
    handler: async (ctx, args) => {
        const messages = await ctx.db.query("messages").collect();
        const filtered = messages.filter(
            (m) =>
                m.receiverId != null &&
                ((m.senderId === args.user1 && m.receiverId === args.user2) ||
                    (m.senderId === args.user2 && m.receiverId === args.user1))
        );
        return filtered.sort((a, b) => a._creationTime - b._creationTime);
    },
});

/** Last message between two users (for sidebar preview). */
export const getLastMessage = query({
    args: {
        user1: v.id("users"),
        user2: v.id("users"),
    },
    handler: async (ctx, args) => {
        const messages = await ctx.db.query("messages").collect();
        const between = messages.filter(
            (m) =>
                m.receiverId != null &&
                ((m.senderId === args.user1 && m.receiverId === args.user2) ||
                    (m.senderId === args.user2 && m.receiverId === args.user1))
        );
        if (between.length === 0) return null;
        const latest = between.reduce((a, b) =>
            a._creationTime >= b._creationTime ? a : b
        );
        return {
            content: latest.content,
            _creationTime: latest._creationTime,
            senderId: latest.senderId,
        };
    },
});

/** Conversation previews for sidebar: other user + last message + time + unread count. */
export const getConversationPreviews = query({
    args: { currentUserId: v.id("users") },
    handler: async (ctx, args) => {
        const [users, allMessages, allReceipts] = await Promise.all([
            ctx.db.query("users").collect(),
            ctx.db.query("messages").collect(),
            ctx.db.query("readReceipts").collect(),
        ]);
        const others = users.filter((u) => u._id !== args.currentUserId);
        return others.map((otherUser) => {
            const between = allMessages.filter(
                (m) =>
                    m.receiverId != null &&
                    ((m.senderId === args.currentUserId && m.receiverId === otherUser._id) ||
                        (m.receiverId === args.currentUserId && m.senderId === otherUser._id))
            );
            const latest =
                between.length === 0
                    ? null
                    : between.reduce((a, b) =>
                          a._creationTime >= b._creationTime ? a : b
                      );
            const receipt = allReceipts.find(
                (r) => r.userId === args.currentUserId && r.peerId === otherUser._id
            );
            const lastReadAt = receipt?.lastReadAt ?? 0;
            const unreadCount = between.filter(
                (m) =>
                    m.receiverId != null &&
                    m.senderId === otherUser._id &&
                    m.receiverId === args.currentUserId &&
                    !m.deleted &&
                    m._creationTime > lastReadAt
            ).length;
            return {
                otherUser,
                lastMessage: latest
                    ? {
                          content: latest.deleted ? "[deleted]" : latest.content,
                          _creationTime: latest._creationTime,
                          senderId: latest.senderId,
                          deleted: latest.deleted,
                      }
                    : null,
                unreadCount,
            };
        });
    },
});
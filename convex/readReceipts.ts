import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const markRead = mutation({
    args: { userId: v.id("users"), peerId: v.id("users") },
    handler: async (ctx, args) => {
        const now = Date.now();
        const existing = await ctx.db
            .query("readReceipts")
            .withIndex("by_user_peer", (q) =>
                q.eq("userId", args.userId).eq("peerId", args.peerId)
            )
            .unique();
        if (existing) {
            await ctx.db.patch(existing._id, { lastReadAt: now });
        } else {
            await ctx.db.insert("readReceipts", {
                userId: args.userId,
                peerId: args.peerId,
                lastReadAt: now,
            });
        }
    },
});

export const getUnreadCount = query({
    args: { userId: v.id("users"), peerId: v.id("users") },
    handler: async (ctx, args) => {
        const [receipt, allMessages] = await Promise.all([
            ctx.db
                .query("readReceipts")
                .withIndex("by_user_peer", (q) =>
                    q.eq("userId", args.userId).eq("peerId", args.peerId)
                )
                .unique(),
            ctx.db.query("messages").collect(),
        ]);
        const lastReadAt = receipt?.lastReadAt ?? 0;
        const fromPeer = allMessages.filter(
            (m) =>
                m.receiverId === args.userId &&
                m.senderId === args.peerId &&
                !m.deleted &&
                m._creationTime > lastReadAt
        );
        return fromPeer.length;
    },
});

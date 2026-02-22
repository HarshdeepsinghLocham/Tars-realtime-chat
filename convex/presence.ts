import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

const ONLINE_TTL_MS = 45_000; // consider offline after 45s

/** Client passes userId (from Convex users table); no server auth required for presence. */
export const updatePresence = mutation({
    args: {
        room: v.string(),
        userId: v.id("users"),
        typing: v.optional(v.boolean()),
    },
    handler: async (ctx, args) => {
        const existing = await ctx.db
            .query("presence")
            .withIndex("by_room_user", (q) =>
                q.eq("room", args.room).eq("userId", args.userId)
            )
            .unique();

        const now = Date.now();
        if (existing) {
            await ctx.db.patch(existing._id, {
                lastSeenAt: now,
                typing: args.typing ?? existing.typing,
            });
        } else {
            await ctx.db.insert("presence", {
                room: args.room,
                userId: args.userId,
                lastSeenAt: now,
                typing: args.typing ?? false,
            });
        }
    },
});

export const getPresence = query({
    args: { room: v.string() },
    handler: async (ctx, args) => {
        const entries = await ctx.db
            .query("presence")
            .withIndex("by_room", (q) => q.eq("room", args.room))
            .collect();
        const now = Date.now();
        return entries
            .filter((e) => now - e.lastSeenAt < ONLINE_TTL_MS)
            .map((e) => ({
                userId: e.userId,
                typing: e.typing ?? false,
                lastSeenAt: e.lastSeenAt,
            }));
    },
});

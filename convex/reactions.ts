import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

const EMOJIS = ["👍", "❤️", "😂", "😮", "😢"] as const;

export const EMOJI_LIST = EMOJIS;

export const getReactions = query({
    args: { messageId: v.id("messages") },
    handler: async (ctx, args) => {
        const list = await ctx.db
            .query("messageReactions")
            .withIndex("by_message", (q) => q.eq("messageId", args.messageId))
            .collect();
        const countMap: Record<string, number> = {};
        for (const r of list) {
            countMap[r.emoji] = (countMap[r.emoji] ?? 0) + 1;
        }
        const counts = Object.entries(countMap).map(([emoji, count]) => ({ emoji, count }));
        return { counts, list };
    },
});

/** Batch reactions for many messages. Uses arrays so emoji are never object keys (Convex requires ASCII keys). */
export const getReactionsForMessageIds = query({
    args: { messageIds: v.array(v.id("messages")) },
    handler: async (ctx, args) => {
        const all = await ctx.db.query("messageReactions").collect();
        const byMessage: Record<string, { counts: { emoji: string; count: number }[]; list: { emoji: string; userId: string }[] }> = {};
        const idSet = new Set(args.messageIds);
        for (const r of all) {
            if (!idSet.has(r.messageId)) continue;
            const key = r.messageId;
            if (!byMessage[key]) byMessage[key] = { counts: [], list: [] };
            const entry = byMessage[key].counts.find((c) => c.emoji === r.emoji);
            if (entry) entry.count += 1;
            else byMessage[key].counts.push({ emoji: r.emoji, count: 1 });
            byMessage[key].list.push({ emoji: r.emoji, userId: r.userId });
        }
        return byMessage;
    },
});

export const toggleReaction = mutation({
    args: {
        messageId: v.id("messages"),
        userId: v.id("users"),
        emoji: v.string(),
    },
    handler: async (ctx, args) => {
        if (!EMOJIS.includes(args.emoji as (typeof EMOJIS)[number])) return;
        const existing = await ctx.db
            .query("messageReactions")
            .withIndex("by_message_user_emoji", (q) =>
                q
                    .eq("messageId", args.messageId)
                    .eq("userId", args.userId)
                    .eq("emoji", args.emoji)
            )
            .unique();
        if (existing) {
            await ctx.db.delete(existing._id);
        } else {
            await ctx.db.insert("messageReactions", {
                messageId: args.messageId,
                userId: args.userId,
                emoji: args.emoji,
            });
        }
    },
});

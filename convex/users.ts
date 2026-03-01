import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const createUser = mutation({
    args: {
        clerkId: v.string(),
        name: v.string(),
        image: v.string(),
    },
    handler: async (ctx, args) => {
        const existing = await ctx.db
            .query("users")
            .withIndex("by_clerkId", (q) =>
                q.eq("clerkId", args.clerkId)
            )
            .unique();

        if (existing) return existing._id;

        return await ctx.db.insert("users", args);
    },
});
export const getCurrentUser = query({
    args: {},
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return null;

        return await ctx.db
            .query("users")
            .withIndex("by_clerkId", (q) =>
                q.eq("clerkId", identity.subject)
            )
            .unique();
    },
});
export const updateUserFromClerk = mutation({
    args: {
        clerkId: v.string(),
        name: v.string(),
        image: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const user = await ctx.db
            .query("users")
            .withIndex("by_clerkId", (q) =>
                q.eq("clerkId", args.clerkId)
            )
            .unique();

        if (!user) return;

        await ctx.db.patch(user._id, {
            name: args.name,
            ...(args.image !== undefined && { image: args.image }),
        });
    },
});

export const getUsers = query({
    handler: async (ctx) => {
        return await ctx.db.query("users").collect();
    },
});
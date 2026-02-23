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
export const updateUserFromClerk = mutation({
    args: {
        clerkId: v.string(),
        name: v.string(),
        image: v.string(),
    },
    handler: async (ctx, args) => {
        const user = await ctx.db
            .query("users")
            .filter(q => q.eq(q.field("clerkId"), args.clerkId))
            .first();

        if (!user) return;

        await ctx.db.patch(user._id, {
            name: args.name,
            image: args.image,
        });
    },
});

export const getUsers = query({
    handler: async (ctx) => {
        return await ctx.db.query("users").collect();
    },
});
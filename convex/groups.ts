import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const createGroup = mutation({
    args: { name: v.string(), createdBy: v.id("users"), memberIds: v.array(v.id("users")) },
    handler: async (ctx, args) => {
        const groupId = await ctx.db.insert("groups", {
            name: args.name,
            createdBy: args.createdBy,
        });
        const allMembers = new Set([args.createdBy, ...args.memberIds]);
        for (const userId of allMembers) {
            await ctx.db.insert("groupMembers", { groupId, userId });
        }
        return groupId;
    },
});

export const getGroupsForUser = query({
    args: { userId: v.id("users") },
    handler: async (ctx, args) => {
        const memberships = await ctx.db
            .query("groupMembers")
            .withIndex("by_user", (q) => q.eq("userId", args.userId))
            .collect();
        const groups = await Promise.all(
            memberships.map((m) => ctx.db.get(m.groupId))
        );
        return groups.filter(Boolean);
    },
});

export const getGroupMembers = query({
    args: { groupId: v.id("groups") },
    handler: async (ctx, args) => {
        const members = await ctx.db
            .query("groupMembers")
            .withIndex("by_group", (q) => q.eq("groupId", args.groupId))
            .collect();
        const users = await Promise.all(members.map((m) => ctx.db.get(m.userId)));
        return users.filter(Boolean);
    },
});

export const sendGroupMessage = mutation({
    args: {
        groupId: v.id("groups"),
        senderId: v.id("users"),
        content: v.string(),
    },
    handler: async (ctx, args) => {
        await ctx.db.insert("messages", {
            senderId: args.senderId,
            groupId: args.groupId,
            content: args.content,
        });
    },
});

export const getGroupMessages = query({
    args: { groupId: v.id("groups") },
    handler: async (ctx, args) => {
        const messages = await ctx.db
            .query("messages")
            .withIndex("by_group", (q) => q.eq("groupId", args.groupId))
            .collect();
        return messages.sort((a, b) => a._creationTime - b._creationTime);
    },
});

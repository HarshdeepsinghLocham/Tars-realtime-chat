import { Doc } from "./_generated/dataModel";
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const createGroup = mutation({
    args: {
        name: v.string(),
        createdBy: v.id("users"),
        memberIds: v.array(v.id("users")),
        image: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const groupId = await ctx.db.insert("groups", {
            name: args.name,
            createdBy: args.createdBy,
            image: args.image,
        });

        const allMembers = new Set([args.createdBy, ...args.memberIds]);

        await Promise.all(
            [...allMembers].map((userId) =>
                ctx.db.insert("groupMembers", {
                    groupId,
                    userId,
                    role: userId === args.createdBy ? "admin" : "member",
                })
            )
        );

        return groupId;
    },
});
export const leaveGroup = mutation({
    args: {
        groupId: v.id("groups"),
        userId: v.id("users"),
    },
    handler: async (ctx, { groupId, userId }) => {
        const membership = await ctx.db
            .query("groupMembers")
            .withIndex("by_group_user", (q) =>
                q.eq("groupId", groupId).eq("userId", userId)
            )
            .unique();

        if (!membership) throw new Error("Not a member");

        await ctx.db.delete(membership._id);
    },
});
export const promoteToAdmin = mutation({
    args: {
        groupId: v.id("groups"),
        adminId: v.id("users"),
        memberId: v.id("users"),
    },
    handler: async (ctx, args) => {
        const admin = await ctx.db
            .query("groupMembers")
            .withIndex("by_group_user", (q) =>
                q.eq("groupId", args.groupId).eq("userId", args.adminId)
            )
            .unique();

        if (!admin || admin.role !== "admin")
            throw new Error("Not authorized");

        const member = await ctx.db
            .query("groupMembers")
            .withIndex("by_group_user", (q) =>
                q.eq("groupId", args.groupId).eq("userId", args.memberId)
            )
            .unique();

        if (!member) throw new Error("User not in group");

        await ctx.db.patch(member._id, { role: "admin" });
    },
});


export const deleteGroup = mutation({
    args: {
        groupId: v.id("groups"),
        adminId: v.id("users"),
    },
    handler: async (ctx, args) => {
        const admin = await ctx.db
            .query("groupMembers")
            .withIndex("by_group_user", (q) =>
                q.eq("groupId", args.groupId).eq("userId", args.adminId)
            )
            .unique();

        if (!admin || admin.role !== "admin")
            throw new Error("Not authorized");

        // delete members
        const members = await ctx.db
            .query("groupMembers")
            .withIndex("by_group", (q) =>
                q.eq("groupId", args.groupId)
            )
            .collect();

        await Promise.all(members.map((m) => ctx.db.delete(m._id)));

        // delete messages
        const messages = await ctx.db
            .query("messages")
            .withIndex("by_group", (q) =>
                q.eq("groupId", args.groupId)
            )
            .collect();

        await Promise.all(messages.map((m) => ctx.db.delete(m._id)));

        await ctx.db.delete(args.groupId);
    },
});

export const updateGroupAvatar = mutation({
    args: {
        groupId: v.id("groups"),
        userId: v.id("users"),
        image: v.string(),
    },
    handler: async (ctx, { groupId, userId, image }) => {
        const membership = await ctx.db
            .query("groupMembers")
            .withIndex("by_group_user", (q) =>
                q.eq("groupId", groupId).eq("userId", userId)
            )
            .unique();

        if (!membership || membership.role !== "admin")
            throw new Error("Only admin can update group avatar");

        await ctx.db.patch(groupId, { image });
    },
});
export const removeMember = mutation({
    args: {
        groupId: v.id("groups"),
        adminId: v.id("users"),
        memberId: v.id("users"),
    },
    handler: async (ctx, args) => {
        const adminMembership = await ctx.db
            .query("groupMembers")
            .withIndex("by_group_user", (q) =>
                q.eq("groupId", args.groupId).eq("userId", args.adminId)
            )
            .unique();

        if (!adminMembership || adminMembership.role !== "admin")
            throw new Error("Not authorized");

        const member = await ctx.db
            .query("groupMembers")
            .withIndex("by_group_user", (q) =>
                q.eq("groupId", args.groupId).eq("userId", args.memberId)
            )
            .unique();

        if (!member) throw new Error("User not in group");

        await ctx.db.delete(member._id);
    },
});
export const setGroupTyping = mutation({
    args: {
        groupId: v.id("groups"),
        userId: v.id("users"),
        typing: v.boolean(),
    },
    handler: async (ctx, { groupId, userId, typing }) => {
        const room = `group:${groupId}`;

        const existing = await ctx.db
            .query("presence")
            .withIndex("by_room_user", (q) =>
                q.eq("room", room).eq("userId", userId)
            )
            .unique();

        if (existing) {
            await ctx.db.patch(existing._id, {
                typing,
                lastSeenAt: Date.now(),
            });
        } else {
            await ctx.db.insert("presence", {
                room,
                userId,
                typing,
                lastSeenAt: Date.now(),
            });
        }
    },
});

export const getGroupsForUser = query({
    args: { userId: v.id("users") },
    handler: async (ctx, args) => {
        const memberships = await ctx.db
            .query("groupMembers")
            .withIndex("by_user", (q) =>
                q.eq("userId", args.userId)
            )
            .collect();

        const groups = await Promise.all(
            memberships.map((m) =>
                ctx.db.get(m.groupId)
            )
        );

        return groups.filter(
            (g): g is Doc<"groups"> => g !== null
        );
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

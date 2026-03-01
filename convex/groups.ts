import { Id } from "./_generated/dataModel";
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

//Internal Helpers (Never exported)

async function getAuthenticatedUser(ctx: any) {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    const user = await ctx.db
        .query("users")
        .withIndex("by_clerkId", (q: any) =>
            q.eq("clerkId", identity.subject)
        )
        .unique();

    if (!user) throw new Error("User not found");
    return user;
}

async function requireMembership(
    ctx: any,
    groupId: Id<"groups">,
    userId: Id<"users">
) {
    const membership = await ctx.db
        .query("groupMembers")
        .withIndex("by_group_user", (q: any) =>
            q.eq("groupId", groupId).eq("userId", userId)
        )
        .unique();

    if (!membership) throw new Error("Not a group member");
    return membership;
}

async function requireAdmin(
    ctx: any,
    groupId: Id<"groups">,
    userId: Id<"users">
) {
    const membership = await requireMembership(ctx, groupId, userId);
    if (membership.role !== "admin") {
        throw new Error("Admin privileges required");
    }
    return membership;
}


// Group Mutations


export const createGroup = mutation({
    args: {
        name: v.string(),
        memberIds: v.array(v.id("users")),
        image: v.optional(v.id("_storage")),
    },
    handler: async (ctx, { name, memberIds, image }) => {
        const user = await getAuthenticatedUser(ctx);

        const groupId = await ctx.db.insert("groups", {
            name,
            createdBy: user._id,
            image,
        });

        const uniqueMembers = new Set([user._id, ...memberIds]);

        await Promise.all(
            [...uniqueMembers].map((userId) =>
                ctx.db.insert("groupMembers", {
                    groupId,
                    userId,
                    role: userId === user._id ? "admin" : "member",
                })
            )
        );

        return groupId;
    },
});

export const updateGroupName = mutation({
    args: {
        groupId: v.id("groups"),
        name: v.string(),
    },
    handler: async (ctx, { groupId, name }) => {
        const user = await getAuthenticatedUser(ctx);
        await requireAdmin(ctx, groupId, user._id);

        await ctx.db.patch(groupId, { name });
    },
});

export const updateGroupAvatar = mutation({
    args: {
        groupId: v.id("groups"),
        image: v.id("_storage"),
    },
    handler: async (ctx, { groupId, image }) => {
        const user = await getAuthenticatedUser(ctx);
        await requireAdmin(ctx, groupId, user._id);

        await ctx.db.patch(groupId, { image });
    },
});

export const addMembers = mutation({
    args: {
        groupId: v.id("groups"),
        memberIds: v.array(v.id("users")),
    },
    handler: async (ctx, { groupId, memberIds }) => {
        const user = await getAuthenticatedUser(ctx);
        await requireAdmin(ctx, groupId, user._id);

        const existing = await ctx.db
            .query("groupMembers")
            .withIndex("by_group", (q) => q.eq("groupId", groupId))
            .collect();

        const existingIds = new Set(existing.map((m) => m.userId));

        const newMembers = memberIds.filter(
            (id) => !existingIds.has(id)
        );

        for (const userId of newMembers) {
            await ctx.db.insert("groupMembers", {
                groupId,
                userId,
                role: "member",
            });
        }
    },
});

export const removeMember = mutation({
    args: {
        groupId: v.id("groups"),
        memberId: v.id("users"),
    },
    handler: async (ctx, { groupId, memberId }) => {
        const user = await getAuthenticatedUser(ctx);
        await requireAdmin(ctx, groupId, user._id);

        if (user._id === memberId) {
            throw new Error("Use leaveGroup instead");
        }

        const membership = await requireMembership(
            ctx,
            groupId,
            memberId
        );

        await ctx.db.delete(membership._id);
    },
});

export const leaveGroup = mutation({
    args: {
        groupId: v.id("groups"),
    },
    handler: async (ctx, { groupId }) => {
        const user = await getAuthenticatedUser(ctx);

        const membership = await requireMembership(
            ctx,
            groupId,
            user._id
        );

        if (membership.role === "admin") {
            const all = await ctx.db
                .query("groupMembers")
                .withIndex("by_group", (q) => q.eq("groupId", groupId))
                .collect();

            const adminCount = all.filter(
                (m) => m.role === "admin"
            ).length;

            if (adminCount <= 1) {
                throw new Error("Cannot leave as last admin");
            }
        }

        await ctx.db.delete(membership._id);
    },
});

export const deleteGroup = mutation({
    args: {
        groupId: v.id("groups"),
    },
    handler: async (ctx, { groupId }) => {
        const user = await getAuthenticatedUser(ctx);
        await requireAdmin(ctx, groupId, user._id);

        const members = await ctx.db
            .query("groupMembers")
            .withIndex("by_group", (q) => q.eq("groupId", groupId))
            .collect();

        const messages = await ctx.db
            .query("messages")
            .withIndex("by_group", (q) => q.eq("groupId", groupId))
            .collect();

        await Promise.all([
            ...members.map((m) => ctx.db.delete(m._id)),
            ...messages.map((m) => ctx.db.delete(m._id)),
            ctx.db.delete(groupId),
        ]);
    },
});

// Messaging

export const sendGroupMessage = mutation({
    args: {
        groupId: v.id("groups"),
        content: v.string(),
    },
    handler: async (ctx, { groupId, content }) => {
        const user = await getAuthenticatedUser(ctx);
        await requireMembership(ctx, groupId, user._id);

        const messageId = await ctx.db.insert("messages", {
            senderId: user._id,
            groupId,
            content,
        });

        await ctx.db.patch(groupId, {
            lastMessageId: messageId,
        });
    },
});


//Queries

export const getGroupMembers = query({
    args: { groupId: v.id("groups") },
    handler: async (ctx, { groupId }) => {
        const members = await ctx.db
            .query("groupMembers")
            .withIndex("by_group", (q) => q.eq("groupId", groupId))
            .collect();

        const users = await Promise.all(
            members.map((m) => ctx.db.get(m.userId))
        );

        return users.filter(Boolean);
    },
});

export const getGroupMessages = query({
    args: { groupId: v.id("groups") },
    handler: async (ctx, { groupId }) => {
        return await ctx.db
            .query("messages")
            .withIndex("by_group", (q) => q.eq("groupId", groupId))
            .order("asc")
            .collect();
    },
});

//  Sidebar Metadata Query
export interface UserGroupWithMeta {
    _id: Id<"groups">;
    name: string;
    imageUrl: string | null;
    lastMessage: {
        content: string;
        senderName: string;
        createdAt: number;
    } | null;
}

export const getUserGroups = query({
    args: {},
    handler: async (ctx): Promise<UserGroupWithMeta[]> => {
        const user = await getAuthenticatedUser(ctx);

        const memberships = await ctx.db
            .query("groupMembers")
            .withIndex("by_user", (q) => q.eq("userId", user._id))
            .collect();

        const groups = await Promise.all(
            memberships.map(async (m) => {
                const group = await ctx.db.get(m.groupId);
                if (!group) return null;

                let imageUrl = null;
                if (group.image) {
                    imageUrl = await ctx.storage.getUrl(group.image);
                }

                let lastMessageData = null;

                if (group.lastMessageId) {
                    const message = await ctx.db.get(
                        group.lastMessageId
                    );
                    if (message) {
                        const sender = await ctx.db.get(
                            message.senderId
                        );
                        lastMessageData = {
                            content: message.content,
                            senderName: sender?.name ?? "Unknown",
                            createdAt: message._creationTime,
                        };
                    }
                }

                return {
                    _id: group._id,
                    name: group.name,
                    imageUrl,
                    lastMessage: lastMessageData,
                };
            })
        );

        return groups.filter(
            (g): g is UserGroupWithMeta => g !== null
        );
    },
});
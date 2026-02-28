import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
    users: defineTable({
        clerkId: v.string(),
        name: v.string(),
        image: v.string(),
    }).index("by_clerkId", ["clerkId"]),

    messages: defineTable({
        senderId: v.id("users"),
        receiverId: v.optional(v.id("users")),
        groupId: v.optional(v.id("groups")),
        content: v.string(),
        deleted: v.optional(v.boolean()),
    })
        .index("by_sender", ["senderId"])
        .index("by_receiver", ["receiverId"])
        .index("by_group", ["groupId"]),

    groups: defineTable({
        name: v.string(),
        createdBy: v.id("users"),
        image: v.optional(v.id("_storage")),
    }).index("by_createdBy", ["createdBy"])
        .searchIndex("search_name", {
            searchField: "name",
        }),
    groupMembers: defineTable({
        groupId: v.id("groups"),
        userId: v.id("users"),
        role: v.optional(
            v.union(v.literal("admin"), v.literal("member"))
        ),
    })
        .index("by_group", ["groupId"])
        .index("by_user", ["userId"])
        .index("by_group_user", ["groupId", "userId"]),

    readReceipts: defineTable({
        userId: v.id("users"),
        peerId: v.id("users"),
        lastReadAt: v.number(),
    }).index("by_user_peer", ["userId", "peerId"]),

    messageReactions: defineTable({
        messageId: v.id("messages"),
        userId: v.id("users"),
        emoji: v.string(),
    })
        .index("by_message", ["messageId"])
        .index("by_message_user_emoji", ["messageId", "userId", "emoji"]),

    // Ephemeral presence: room (e.g. "online" or "conv:userId1:userId2"), lastSeenAt, optional typing
    presence: defineTable({
        room: v.string(),
        userId: v.id("users"),
        lastSeenAt: v.number(),
        typing: v.optional(v.boolean()),
    })
        .index("by_room", ["room"])
        .index("by_room_user", ["room", "userId"]),

    groupReadReceipts: defineTable({
        groupId: v.id("groups"),
        userId: v.id("users"),
        lastReadAt: v.number(),
    })
        .index("by_group_user", ["groupId", "userId"]),
});
import type { Id } from "../../convex/_generated/dataModel";

/** Room name for global online list. Must match value used in Convex presence. */
export const ONLINE_ROOM = "online";

/** Room name for a conversation (sorted ids so both sides use same key). */
export function conversationRoom(
    userId1: Id<"users">,
    userId2: Id<"users">
): string {
    return [userId1, userId2].sort().join(":");
}

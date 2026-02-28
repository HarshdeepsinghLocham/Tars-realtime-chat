import type { Id } from "../../convex/_generated/dataModel";

export interface UserGroupWithMeta {
  _id: Id<"groups">;
  name: string;
  imageUrl: string | null;
  lastMessage: {
    content: string;
    senderName: string;
    createdAt: number;
  } | null;
  lastMessageTime: number | null;
}


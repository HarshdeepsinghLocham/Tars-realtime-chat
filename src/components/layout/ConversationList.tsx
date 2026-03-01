
import type { Id } from "../../../convex/_generated/dataModel";
import ConversationItem from "./ConversationItem";
import type { UserGroupWithMeta } from "../../../convex/groups";

type SelectedConversation =
    | { type: "dm"; id: Id<"users"> }
    | { type: "group"; id: Id<"groups"> }
    | null;

interface Props {
    selectedConversation: SelectedConversation;
    dms: any[];
    groups: UserGroupWithMeta[] | undefined;
    onlineSet: Set<Id<"users">>;
    currentUserId: Id<"users"> | null;
    onSelectConversation: (c: SelectedConversation) => void;
    onMarkRead: any;
}

export default function ConversationList({
    selectedConversation,
    dms,
    groups,
    onlineSet,
    currentUserId,
    onSelectConversation,
    onMarkRead,
}: Props) {
    return (
        <div className="flex-1 min-h-0 overflow-y-auto py-1 scrollbar-thin scrollbar-thumb-neutral-800 scrollbar-track-neutral-900">
            {dms.map((dm) => (
                <ConversationItem
                    key={`dm-${dm.otherUser._id}`}
                    type="dm"
                    id={dm.otherUser._id}
                    name={dm.otherUser.name}
                    image={dm.otherUser.image}
                    lastMessage={dm.lastMessage}
                    unreadCount={dm.unreadCount}
                    selectedConversation={selectedConversation}
                    isOnline={onlineSet.has(dm.otherUser._id)}
                    currentUserId={currentUserId}
                    onSelect={onSelectConversation}
                    onMarkRead={onMarkRead}
                />
            ))}

            {groups?.map((group) => (
                <ConversationItem
                    key={`group-${group._id}`}
                    type="group"
                    id={group._id}
                    name={group.name}
                    image={group.imageUrl}
                    lastMessage={group.lastMessage}
                    selectedConversation={selectedConversation}
                    onSelect={onSelectConversation}
                />
            ))}
        </div>
    );
}
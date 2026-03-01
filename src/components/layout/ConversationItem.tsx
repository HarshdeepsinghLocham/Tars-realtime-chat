// ConversationItem.tsx
import { formatMessageTime } from "@/lib/utils";

export default function ConversationItem({
    type,
    id,
    name,
    image,
    lastMessage,
    unreadCount,
    selectedConversation,
    isOnline,
    currentUserId,
    onSelect,
    onMarkRead,
}: any) {
    const isSelected =
        selectedConversation?.id === id &&
        selectedConversation?.type === type;
    return (
        <button
            onClick={() => {
                onSelect({ type, id });
                if (type === "dm" && currentUserId) {
                    onMarkRead({ userId: currentUserId, peerId: id });
                }
            }}
            className={`w-full px-2 py-2 text-left rounded-lg transition-colors
                ${isSelected ? "bg-neutral-800 text-white" : "bg-transparent"}
                hover:bg-neutral-700/80 focus:bg-neutral-700/80
                border border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500
            `}
        >
            <div className="flex gap-2 items-start">
                <div className="relative">
                    {image ? (
                        <img
                            src={image}
                            className="w-9 h-9 rounded-full object-cover"
                        />
                    ) : (
                        <div className="w-9 h-9 rounded-full bg-neutral-700 flex items-center justify-center text-xs text-white">
                            {name.charAt(0)}
                        </div>
                    )}
                    {type === "dm" && isOnline && (
                        <span className="absolute bottom-0 right-0 w-2 h-2 bg-emerald-500 rounded-full border-2 border-neutral-900" />
                    )}
                </div>

                <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{name}</p>

                    {lastMessage && (
                        <div className="flex justify-between items-center mt-0.5">
                            <p className="text-xs text-neutral-400 truncate">
                                {type === "group" && (
                                    <span className="text-blue-400 mr-1">
                                        {lastMessage.senderName}:
                                    </span>
                                )}

                                {lastMessage.deleted
                                    ? "Message deleted"
                                    : lastMessage.content}
                            </p>

                            <span className="text-[10px] text-neutral-500 whitespace-nowrap ml-2">
                                {formatMessageTime(
                                    type === "dm"
                                        ? lastMessage._creationTime
                                        : lastMessage.createdAt
                                )}
                            </span>
                        </div>
                    )}
                </div>

                {unreadCount ? (
                    <span className="text-xs bg-blue-500 text-white px-2 rounded-full">
                        {unreadCount}
                    </span>
                ) : null}
            </div>
        </button>
    );
}
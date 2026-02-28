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
                    onMarkRead({
                        userId: currentUserId,
                        peerId: id,
                    });
                }
            }}
            className={`w-full px-2 py-2 text-left ${isSelected ? "bg-neutral-100 dark:bg-neutral-700" : ""
                }`}
        >
            <div className="flex gap-2 items-start">
                <div className="relative">
                    {image ? (
                        <img
                            src={image}
                            className="w-9 h-9 rounded-full object-cover"
                        />
                    ) : (
                        <div className="w-9 h-9 rounded-full bg-neutral-300 flex items-center justify-center text-xs">
                            {name.charAt(0)}
                        </div>
                    )}
                    {type === "dm" && isOnline && (
                        <span className="absolute bottom-0 right-0 w-2 h-2 bg-emerald-500 rounded-full" />
                    )}
                </div>

                <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{name}</p>

                    {type === "dm" && lastMessage && (
                        <>
                            <p className="text-xs text-neutral-400 truncate">
                                {lastMessage.content}
                            </p>
                            <p className="text-xs text-neutral-400">
                                {formatMessageTime(lastMessage._creationTime)}
                            </p>
                        </>
                    )}
                    {type === "group" && lastMessage && (
                        <p className="text-xs text-neutral-500 truncate">
                            <span className="text-blue-300">{lastMessage.senderName}</span> {lastMessage.content}
                        </p>
                    )}

                    {lastMessage?.createdAt && (
                        <span className="text-[10px] text-neutral-400">
                            {formatMessageTime(lastMessage.createdAt)}
                        </span>
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
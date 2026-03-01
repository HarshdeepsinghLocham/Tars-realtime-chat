
import { LogOut, MessageSquareDiff } from "lucide-react";
import { UserButton } from "@clerk/nextjs";
import ThemeToggle from "@/components/theme/ThemeToggle";
import type { Doc } from "../../../convex/_generated/dataModel";

interface Props {
    currentUser: Doc<"users"> | null;
    onOpenCreate: () => void;
    onSignOut: () => void;
}

export default function LeftPanelHeader({
    currentUser,
    onOpenCreate,
    onSignOut,
}: Props) {
    return (
        <div className="px-3 py-4 border-b border-neutral-200 dark:border-neutral-700">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0">
                    <UserButton />
                    <span className="text-sm font-semibold truncate">
                        {currentUser?.name ?? "Messages"}
                    </span>
                </div>

                <div className="flex items-center gap-2">
                    <button onClick={onOpenCreate}>
                        <MessageSquareDiff size={18} />
                    </button>
                    <ThemeToggle />
                    <button onClick={onSignOut}>
                        <LogOut size={16} />
                    </button>
                </div>
            </div>
        </div>
    );
}
import { Search } from "lucide-react";

interface Props {
    value: string;
    onChange: (v: string) => void;
}

export default function ConversationSearch({ value, onChange }: Props) {
    return (
        <div className="px-3 py-2 border-b border-neutral-200 dark:border-neutral-700">
            <div className="relative">
                <Search
                    size={14}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400"
                />
                <input
                    type="search"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder="Search"
                    className="w-full pl-8 pr-3 py-2 text-sm rounded-lg border"
                />
            </div>
        </div>
    );
}
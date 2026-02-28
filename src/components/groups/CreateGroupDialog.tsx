"use client";

import { useEffect, useState, useCallback } from "react";
import type { Doc, Id } from "../../../convex/_generated/dataModel";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";

interface Props {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    currentUserId: Id<"users"> | null;
    users: Doc<"users">[];
    onCreate: (data: {
        name: string;
        memberIds: Id<"users">[];
        image?: Id<"_storage">;
    }) => Promise<void>;
}

export default function CreateGroupDialog({
    open,
    onOpenChange,
    currentUserId,
    users,
    onCreate,
}: Props) {
    const generateUploadUrl = useMutation(api.files.generateUploadUrl);

    const [groupName, setGroupName] = useState("");
    const [selectedMembers, setSelectedMembers] = useState<Id<"users">[]>([]);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [storageId, setStorageId] = useState<Id<"_storage"> | null>(null);

    const [isUploading, setIsUploading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Cleanup preview memory
    useEffect(() => {
        return () => {
            if (previewUrl) URL.revokeObjectURL(previewUrl);
        };
    }, [previewUrl]);

    // ---------- Utilities ----------

    const getInitials = (name: string) =>
        name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase()
            .slice(0, 2);

    const compressImage = (file: File): Promise<File> => {
        return new Promise((resolve, reject) => {
            const img = new Image();
            const reader = new FileReader();

            reader.readAsDataURL(file);
            reader.onload = (e) => {
                img.src = e.target?.result as string;
            };

            img.onload = () => {
                const canvas = document.createElement("canvas");
                const ctx = canvas.getContext("2d");
                if (!ctx) return reject("Canvas not supported");

                const MAX_WIDTH = 600;
                const scale = Math.min(MAX_WIDTH / img.width, 1);

                canvas.width = img.width * scale;
                canvas.height = img.height * scale;

                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

                canvas.toBlob(
                    (blob) => {
                        if (!blob) return reject("Compression failed");
                        resolve(
                            new File([blob], file.name, {
                                type: "image/jpeg",
                            })
                        );
                    },
                    "image/jpeg",
                    0.8
                );
            };
        });
    };

    const uploadImage = async (file: File) => {
        if (!file.type.startsWith("image/"))
            throw new Error("Only image files allowed");

        if (file.size > 5 * 1024 * 1024)
            throw new Error("Image must be under 5MB");

        setIsUploading(true);
        setError(null);

        try {
            const compressed = await compressImage(file);

            const uploadUrl = await generateUploadUrl({});
            const result = await fetch(uploadUrl, {
                method: "POST",
                headers: { "Content-Type": compressed.type },
                body: compressed,
            });

            if (!result.ok) throw new Error("Upload failed");

            const { storageId } = await result.json();
            return storageId as Id<"_storage">;
        } finally {
            setIsUploading(false);
        }
    };

    const handleFile = async (file: File) => {
        try {
            const preview = URL.createObjectURL(file);
            setPreviewUrl(preview);

            const id = await uploadImage(file);
            setStorageId(id);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Upload failed");
        }
    };

    const handleDrop = useCallback(
        async (e: React.DragEvent<HTMLDivElement>) => {
            e.preventDefault();
            setIsDragging(false);
            const file = e.dataTransfer.files?.[0];
            if (file) await handleFile(file);
        },
        []
    );

    const resetState = () => {
        setGroupName("");
        setSelectedMembers([]);
        setPreviewUrl(null);
        setStorageId(null);
        setError(null);
    };

    const handleSubmit = async () => {
        if (!groupName.trim() || !currentUserId) return;

        setIsSubmitting(true);
        try {
            await onCreate({
                name: groupName.trim(),
                memberIds: selectedMembers,
                image: storageId ?? undefined,
            });

            resetState();
            onOpenChange(false);
        } catch {
            setError("Failed to create group");
        } finally {
            setIsSubmitting(false);
        }
    };

    const isDisabled =
        !groupName.trim() ||
        selectedMembers.length === 0 ||
        isUploading ||
        isSubmitting;

    return (
        <Dialog
            open={open}
            onOpenChange={(val) => {
                if (!val) resetState();
                onOpenChange(val);
            }}
        >
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Create New Group</DialogTitle>
                </DialogHeader>

                <div className="space-y-5">

                    {/* Avatar Upload Area */}
                    <div
                        onDragOver={(e) => {
                            e.preventDefault();
                            setIsDragging(true);
                        }}
                        onDragLeave={() => setIsDragging(false)}
                        onDrop={handleDrop}
                        className={`flex justify-center transition-all ${isDragging ? "scale-105" : ""
                            }`}
                    >
                        <label className="cursor-pointer relative">
                            <div
                                className={`w-24 h-24 rounded-full border flex items-center justify-center text-lg font-semibold overflow-hidden ${isDragging ? "border-primary" : "border-border"
                                    }`}
                            >
                                {previewUrl ? (
                                    <img
                                        src={previewUrl}
                                        alt="preview"
                                        className="w-full h-full object-cover"
                                    />
                                ) : groupName ? (
                                    getInitials(groupName)
                                ) : (
                                    "Upload"
                                )}
                            </div>

                            {isUploading && (
                                <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center text-white text-xs">
                                    Uploading...
                                </div>
                            )}

                            <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) =>
                                    e.target.files && handleFile(e.target.files[0])
                                }
                            />
                        </label>
                    </div>

                    {/* Group Name */}
                    <input
                        type="text"
                        value={groupName}
                        onChange={(e) => setGroupName(e.target.value)}
                        placeholder="Group name"
                        className="w-full px-3 py-2 rounded-md border text-sm focus:ring-2 focus:ring-primary/40"
                    />

                    {/* Members */}
                    <div className="max-h-44 overflow-y-auto border rounded-md p-2 space-y-1">
                        {users.map((u) => (
                            <label
                                key={u._id}
                                className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-accent cursor-pointer"
                            >
                                <input
                                    type="checkbox"
                                    checked={selectedMembers.includes(u._id)}
                                    onChange={() =>
                                        setSelectedMembers((prev) =>
                                            prev.includes(u._id)
                                                ? prev.filter((m) => m !== u._id)
                                                : [...prev, u._id]
                                        )
                                    }
                                />
                                <span className="text-sm">{u.name}</span>
                            </label>
                        ))}
                    </div>

                    {error && (
                        <p className="text-sm text-red-500 text-center">{error}</p>
                    )}

                    <button
                        onClick={handleSubmit}
                        disabled={isDisabled}
                        className="w-full py-2.5 rounded-md bg-primary text-white text-sm font-semibold disabled:opacity-50"
                    >
                        {isSubmitting ? "Creating..." : "Create Group"}
                    </button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
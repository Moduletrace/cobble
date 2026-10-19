import { useState } from "react";
import { AppData } from "@/src/data/app-data";
import type { BotMessageAttachment } from "@/src/types";
import uploadBotAttachment from "../(functions)/upload-bot-attachment";

export type PendingAttachment = {
    key: string;
    name: string;
    status: "uploading" | "ready" | "failed";
    attachment?: BotMessageAttachment;
    error?: string;
};

/**
 * The files picked for the next message: each uploads as soon as it's
 * added, so sending only waits for ones still going up.
 */
export default function useComposerAttachments() {
    const [pending, setPending] = useState<PendingAttachment[]>([]);

    const update = ({ key, ...fields }: Partial<PendingAttachment> & { key: string }) =>
        setPending((prev) => prev.map((item) => (item.key == key ? { ...item, ...fields } : item)));

    const add = ({ files }: { files: File[] }) => {
        const room = AppData.BotAttachmentMaxFiles - pending.length;
        const picked = files.slice(0, Math.max(room, 0));

        const added = picked.map((file) => ({
            file,
            item: {
                key: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
                name: file.name || "file",
                status: "uploading" as const,
            },
        }));

        setPending((prev) => [...prev, ...added.map(({ item }) => item)]);

        for (const { file, item } of added) {
            uploadBotAttachment({ file })
                .then((res) =>
                    res.success && res.singleRes
                        ? update({ key: item.key, status: "ready", attachment: res.singleRes })
                        : update({ key: item.key, status: "failed", error: res.msg || "Upload failed" }),
                )
                .catch(() => update({ key: item.key, status: "failed", error: "Upload failed" }));
        }
    };

    const remove = ({ key }: { key: string }) =>
        setPending((prev) => prev.filter((item) => item.key != key));

    return {
        pending,
        add,
        remove,
        clear: () => setPending([]),
        uploading: pending.some((item) => item.status == "uploading"),
        media_ids: pending.flatMap((item) =>
            item.status == "ready" && item.attachment ? [item.attachment.id] : [],
        ),
        full: pending.length >= AppData.BotAttachmentMaxFiles,
    };
}

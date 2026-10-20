import { useEffect, useState } from "react";
import { AppData } from "@/src/data/app-data";
import type { BotMessageAttachment } from "@/src/types";
import uploadBotAttachment from "../(functions)/upload-bot-attachment";
import composerDraftKey from "../(utils)/composer-draft-key";

export type PendingAttachment = {
    key: string;
    name: string;
    status: "uploading" | "ready" | "failed";
    attachment?: BotMessageAttachment;
    error?: string;
    /**
     * A local object URL of a picked image, shown while it uploads and
     * after, so its preview never waits for the server.
     */
    preview_url?: string;
};

type Params = {
    bot_id?: number | "" | null;
    workspace_id?: number | null;
};

/**
 * The files picked for the next message: each uploads as soon as it's
 * added, so sending only waits for ones still going up. Uploaded ones are
 * kept in `localStorage` per bot and workspace until sent, like the text
 * (`useComposerDraft`), and come back after a reload.
 */
export default function useComposerAttachments({ bot_id, workspace_id }: Params) {
    const storage_key = composerDraftKey({ bot_id, workspace_id, part: "files" });
    const [pending, setPending] = useState<PendingAttachment[]>([]);
    const [loaded_key, setLoadedKey] = useState<string>();

    useEffect(() => {
        let saved: BotMessageAttachment[] = [];

        try {
            saved = JSON.parse(localStorage.getItem(storage_key) || "[]");
        } catch {}

        setPending(
            (Array.isArray(saved) ? saved : []).map((attachment) => ({
                key: `saved-${attachment.id}`,
                name: attachment.name,
                status: "ready" as const,
                attachment,
            })),
        );
        setLoadedKey(storage_key);
    }, [storage_key]);

    useEffect(() => {
        if (loaded_key != storage_key) return;

        const ready = pending.flatMap((item) =>
            item.status == "ready" && item.attachment ? [item.attachment] : [],
        );

        try {
            if (ready.length) localStorage.setItem(storage_key, JSON.stringify(ready));
            else localStorage.removeItem(storage_key);
        } catch {}
    }, [pending, loaded_key]);

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
                preview_url: file.type.startsWith("image/")
                    ? URL.createObjectURL(file)
                    : undefined,
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

    const revoke = ({ items }: { items: PendingAttachment[] }) =>
        items.forEach((item) => item.preview_url && URL.revokeObjectURL(item.preview_url));

    const remove = ({ key }: { key: string }) => {
        revoke({ items: pending.filter((item) => item.key == key) });
        setPending((prev) => prev.filter((item) => item.key != key));
    };

    /**
     * Puts files already uploaded back, after a send that didn't make it.
     */
    const restore = ({ attachments }: { attachments: BotMessageAttachment[] }) => {
        if (!attachments.length) return;

        setPending((prev) => [
            ...prev,
            ...attachments.map((attachment) => ({
                key: `restored-${attachment.id}-${Date.now()}`,
                name: attachment.name,
                status: "ready" as const,
                attachment,
            })),
        ]);
    };

    return {
        pending,
        add,
        remove,
        restore,
        clear: () => {
            revoke({ items: pending });
            setPending([]);
        },
        uploading: pending.some((item) => item.status == "uploading"),
        media_ids: pending.flatMap((item) =>
            item.status == "ready" && item.attachment ? [item.attachment.id] : [],
        ),
        full: pending.length >= AppData.BotAttachmentMaxFiles,
    };
}

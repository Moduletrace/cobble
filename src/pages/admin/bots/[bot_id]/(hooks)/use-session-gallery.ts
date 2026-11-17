import { useMemo } from "react";
import type { BotMessageWithAttachments, FilePreviewItem, PublicBotFile } from "@/src/types";
import liveFileRefIds from "@/src/utils/live-file-ref-ids";
import sessionImageGallery from "@/src/utils/session-image-gallery";
import useReferencedFiles from "./use-referenced-files";

/**
 * The whole conversation's images as one gallery, resolved once for the
 * thread: every message's named files (`[file:ID]`) looked up together
 * through the same cache the chips use, then handed to the session gallery.
 * Memoised so the thread's message rows don't re-render on every pass.
 */
export default function useSessionGallery({
    messages,
}: {
    messages: BotMessageWithAttachments[];
}): FilePreviewItem[] {
    const ref_ids = useMemo(() => {
        const ids: number[] = [];

        for (const message of messages) {
            const attachments = message.attachments || [];

            for (const id of liveFileRefIds({ text: message.text || "" })) {
                if (attachments.some((it) => it.file_id == id)) continue;
                if (!ids.includes(id)) ids.push(id);
            }
        }

        return ids;
    }, [messages]);

    const referenced = useReferencedFiles({ file_ids: ref_ids });

    // useReferencedFiles returns a fresh array each render; a resolved row's
    // name and URL never change, so the ids that resolved stand in for it.
    const resolved_key = referenced.map((file) => file?.id ?? 0).join(",");

    // ref_ids rides on messages and referenced on resolved_key (a row's id
    // fixes its name and URL), so these two keys stand in for all four.
    return useMemo(() => {
        const files = new Map<number, PublicBotFile | null>();

        ref_ids.forEach((id, position) => files.set(id, referenced[position] ?? null));

        return sessionImageGallery({ messages, files });
    }, [messages, resolved_key]);
}

import path from "node:path";
import { AppData } from "@/src/data/app-data";
import grabMessagesMedia, {
    type MessageMediaRow,
} from "@/src/functions/backend/db/bots/grab-messages-media";
import type { HarnessContentPart } from "@/src/harness/types";
import type { BotMessageWithAttachments } from "@/src/types";
import grabDirNames from "@/src/utils/grab-dir-names";

type Params = {
    /**
     * The conversation a reply reads, oldest first.
     */
    messages: BotMessageWithAttachments[];
};

/**
 * The files of the latest few messages that have any
 * (`AppData.BotReplyAttachmentMessages`), as model input by message id:
 * images and audio as themselves (a model that can't take them gets them
 * read first), documents as their text, videos as a note. Older files are
 * only named (`botMessagesToHarness`).
 */
export default async function loadAttachmentParts({ messages }: Params) {
    const recent = messages
        .filter((message) => message.attachments?.length)
        .slice(-AppData.BotReplyAttachmentMessages)
        .map((message) => Number(message.id));

    const media = await grabMessagesMedia({ message_ids: recent });
    const parts = new Map<number, HarnessContentPart[]>();

    for (const [message_id, files] of media) {
        parts.set(
            message_id,
            (await Promise.all(files.map((file) => fileToParts({ file })))).flat(),
        );
    }

    return parts;
}

async function fileToParts({ file }: { file: MessageMediaRow }): Promise<HarnessContentPart[]> {
    const name = file.title || `file ${file.id}`;

    if (file.media_type == "document") {
        const text = file.text_content?.trim();

        if (!text) {
            return [{ type: "text", text: `[Attached file "${name}": its text couldn't be read.]` }];
        }

        const cut = text.length > AppData.BotAttachmentMaxTextChars;

        return [
            {
                type: "text",
                text: `Attached file "${name}":\n\n${text.slice(0, AppData.BotAttachmentMaxTextChars)}${cut ? `\n\n[The rest of "${name}" was cut: it's ${text.length} characters long.]` : ""}`,
            },
        ];
    }

    if (file.media_type == "video") {
        return [{ type: "text", text: `[Attached video "${name}": videos can't be read yet.]` }];
    }

    const disk = Bun.file(path.join(grabDirNames().DATA_DIR, file.media_write_path || ""));

    if (!file.media_write_path || !(await disk.exists())) {
        return [{ type: "text", text: `[Attached file "${name}" is missing on the server.]` }];
    }

    const base64 = Buffer.from(await disk.arrayBuffer()).toString("base64");

    if (file.media_type == "image") {
        return [
            { type: "text", text: `[Attached image "${name}"]` },
            { type: "image", url: `data:image/${file.mime_type || "jpeg"};base64,${base64}`, name },
        ];
    }

    return [
        { type: "text", text: `[Attached audio "${name}"]` },
        { type: "audio", data: base64, format: file.mime_type || "mp3", name },
    ];
}

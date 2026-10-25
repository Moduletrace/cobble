import mediaFilePath from "@/src/utils/media-file-path";
import { AppData } from "@/src/data/app-data";
import grabMessagesMedia, {
    type MessageMediaRow,
} from "@/src/functions/backend/db/bots/grab-messages-media";
import type { HarnessContentPart } from "@/src/harness/types";
import type { BotMessageWithAttachments } from "@/src/types";
import describeAttachment from "./describe-attachment";

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

    const media = await grabMessagesMedia({
        message_ids: recent,
        with_text_content: true,
    });
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
    /**
     * The upload's own id, so a bot can name it back to a tool
     * (`set_picture` and `update_workspace` take one) instead of guessing
     * which file the user means.
     */
    const label = describeAttachment({ name, id: file.id! });

    if (file.media_type == "document") {
        const text = file.text_content?.trim();

        if (!text) {
            return [{ type: "text", text: `[Attached file ${label}: its text couldn't be read.]` }];
        }

        const cut = text.length > AppData.BotAttachmentMaxTextChars;

        return [
            {
                type: "text",
                text: `Attached file ${label}:\n\n${text.slice(0, AppData.BotAttachmentMaxTextChars)}${cut ? `\n\n[The rest of "${name}" was cut: it's ${text.length} characters long.]` : ""}`,
            },
        ];
    }

    if (file.media_type == "video") {
        return [{ type: "text", text: `[Attached video ${label}: videos can't be read yet.]` }];
    }

    const absolute = mediaFilePath({ write_path: file.media_write_path });
    const disk = absolute ? Bun.file(absolute) : null;

    if (!disk || !(await disk.exists())) {
        return [{ type: "text", text: `[Attached file ${label} is missing on the server.]` }];
    }

    const base64 = Buffer.from(await disk.arrayBuffer()).toString("base64");

    if (file.media_type == "image") {
        return [
            { type: "text", text: `[Attached image ${label}]` },
            { type: "image", url: `data:image/${file.mime_type || "jpeg"};base64,${base64}`, name },
        ];
    }

    return [
        { type: "text", text: `[Attached audio ${label}]` },
        { type: "audio", data: base64, format: file.mime_type || "mp3", name },
    ];
}

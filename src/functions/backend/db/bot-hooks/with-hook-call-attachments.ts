import type { BotHookCall } from "@/src/types";
import grabMessagesMedia from "../bots/grab-messages-media";
import mediaToAttachment from "../bots/media-to-attachment";

type Params = {
    calls: BotHookCall[];
};

/**
 * Hook calls with the files their runs sent with their answers.
 */
export default async function withHookCallAttachments({ calls }: Params) {
    const media = await grabMessagesMedia({
        message_ids: calls.map((call) => Number(call.response_message_id)),
    });

    return calls.map((call) => ({
        ...call,
        attachments: (media.get(Number(call.response_message_id)) || []).map((row) => mediaToAttachment({ media: row })),
    }));
}

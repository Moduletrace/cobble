import fetchApi from "@moduletrace/twui/utils/fetch/fetchApi";
import type { APIResponseObject } from "@moduletrace/bunext/types";
import type { RetryReplyRequest } from "@/src/schemas/bot-schema";

/**
 * Queues the bot's reply again: after one failed (from its failure notice),
 * or to answer afresh the message the user asked to run again.
 */
export default async function retryBotReply({ message_id }: RetryReplyRequest) {
    return await fetchApi<RetryReplyRequest, APIResponseObject<{ message_id: number }>>(
        `/api/admin/bots/retry-reply`,
        {
            method: "POST",
            body: { message_id },
        },
    );
}

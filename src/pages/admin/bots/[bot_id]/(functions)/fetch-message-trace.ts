import fetchApi from "@moduletrace/twui/utils/fetch/fetchApi";
import type { APIResponseObject } from "@moduletrace/bunext/types";
import type { BotTraceJob } from "@/src/types";

type Params = {
    message_id: number;
};

/**
 * What the run behind one message did, in detail: the debug logs tab of
 * its Details modal. Read when that tab is opened rather than with the
 * details, since a long run's tool answers are the biggest thing the modal
 * would carry.
 */
export default async function fetchMessageTrace({ message_id }: Params) {
    return await fetchApi<{ message_id: number }, APIResponseObject<BotTraceJob[]>>(
        "/api/admin/bots/message-trace",
        { method: "POST", body: { message_id } },
    );
}
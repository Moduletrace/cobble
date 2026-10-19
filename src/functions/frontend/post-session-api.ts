import fetchApi from "@moduletrace/twui/utils/fetch/fetchApi";
import type { APIResponseObject } from "@moduletrace/bunext/types";

type Params = {
    /**
     * Under `/api/admin/bots/`.
     */
    path: "list-sessions" | "new-session" | "reopen-session" | "session-messages";
    body: Record<string, unknown>;
};

/**
 * Posts to a conversation-session API route.
 */
export default async function postSessionApi<T extends { [k: string]: any }>({ path, body }: Params) {
    return await fetchApi<Record<string, unknown>, APIResponseObject<T>>(`/api/admin/bots/${path}`, {
        method: "POST",
        body,
    });
}

import fetchApi from "@moduletrace/twui/utils/fetch/fetchApi";
import type { APIResponseObject } from "@moduletrace/bunext/types";
import type { BotConversationRequest } from "@/src/schemas/bot-schema";
import type { BotHarnessOverviewPayload } from "@/src/types";

/**
 * What a conversation's models modal edits: per harness, the setting, the
 * models it can pick and what it runs on now.
 */
export default async function fetchHarnessOverview({ bot_id, workspace_id }: BotConversationRequest) {
    return await fetchApi<
        BotConversationRequest,
        APIResponseObject<BotHarnessOverviewPayload>
    >(`/api/admin/bots/harness-overview`, {
        method: "POST",
        body: { bot_id, workspace_id },
    });
}

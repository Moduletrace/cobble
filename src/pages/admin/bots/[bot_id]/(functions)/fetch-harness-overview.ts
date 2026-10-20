import fetchApi from "@moduletrace/twui/utils/fetch/fetchApi";
import type { APIResponseObject } from "@moduletrace/bunext/types";
import type { BotConversationRequest } from "@/src/schemas/bot-schema";
import type { BotHarnessSettingsPayload } from "@/src/types";

/**
 * What a conversation's models form edits, without the install-wide
 * catalog: the setting, what runs now, and what the default runs on.
 */
export default async function fetchHarnessOverview({ bot_id, workspace_id }: BotConversationRequest) {
    return await fetchApi<
        BotConversationRequest,
        APIResponseObject<BotHarnessSettingsPayload>
    >(`/api/admin/bots/harness-overview`, {
        method: "POST",
        body: { bot_id, workspace_id },
    });
}

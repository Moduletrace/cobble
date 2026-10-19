import fetchApi from "@moduletrace/twui/utils/fetch/fetchApi";
import type { APIResponseObject } from "@moduletrace/bunext/types";
import type { SaveBotHarnessSettingsRequest } from "@/src/schemas/harness-schema";
import type { BotHarnessOverviewPayload } from "@/src/types";

/**
 * Saves a worker bot's own model settings and returns the fresh page data.
 */
export default async function saveBotHarnessSettings(
    body: SaveBotHarnessSettingsRequest,
) {
    return await fetchApi<
        SaveBotHarnessSettingsRequest,
        APIResponseObject<BotHarnessOverviewPayload>
    >(`/api/admin/bots/save-harness-settings`, {
        method: "POST",
        body,
    });
}

import fetchApi from "@moduletrace/twui/utils/fetch/fetchApi";
import type { APIResponseObject } from "@moduletrace/bunext/types";
import type { SaveBotHarnessSettingsRequest } from "@/src/schemas/harness-schema";
import type { BotHarnessOverviewPayload } from "@/src/types";
import { clearHarnessCache } from "@/src/utils/harness-cache";

/**
 * Saves a worker bot's own model settings and returns the fresh page data.
 */
export default async function saveBotHarnessSettings(
    body: SaveBotHarnessSettingsRequest,
) {
    const res = await fetchApi<
        SaveBotHarnessSettingsRequest,
        APIResponseObject<BotHarnessOverviewPayload>
    >(`/api/admin/bots/save-harness-settings`, {
        method: "POST",
        body,
    });

    if (res.success) clearHarnessCache();

    return res;
}

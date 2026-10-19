import fetchApi from "@moduletrace/twui/utils/fetch/fetchApi";
import type { APIResponseObject } from "@moduletrace/bunext/types";
import type { SaveWorkspaceHarnessSettingsRequest } from "@/src/schemas/harness-schema";
import type { BotHarnessOverviewPayload } from "@/src/types";

/**
 * Saves a workspace's model settings and returns the fresh page data.
 */
export default async function saveWorkspaceHarnessSettings(body: SaveWorkspaceHarnessSettingsRequest) {
    return await fetchApi<
        SaveWorkspaceHarnessSettingsRequest,
        APIResponseObject<BotHarnessOverviewPayload>
    >(`/api/admin/workspaces/save-harness-settings`, {
        method: "POST",
        body,
    });
}

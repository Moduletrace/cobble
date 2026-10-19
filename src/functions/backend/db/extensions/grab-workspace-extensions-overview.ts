import type { BotExtensionsPayload } from "@/src/types";
import grabCrewRole from "../access/grab-crew-role";
import grabExtensionsOverview from "./grab-extensions-overview";

type Params = {
    /**
     * Who's looking: only super admins and admins get what can be added.
     */
    user_id: number | string;
    workspace_id: number | string;
};

/**
 * The MCP servers and tools every bot working in a workspace gets there,
 * and the rest of them, which can be added.
 */
export default async function grabWorkspaceExtensionsOverview({
    user_id,
    workspace_id,
}: Params): Promise<BotExtensionsPayload> {
    const role = await grabCrewRole({ user_id });

    return grabExtensionsOverview({ can_manage: role != "member", workspace_id });
}

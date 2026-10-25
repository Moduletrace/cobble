import grabCrewRole from "@/src/functions/backend/db/access/grab-crew-role";
import type { HarnessTool } from "../../../types";
import deleteExtensionTool from "./delete-extension-tool";
import listExtensionsTool from "./list-extensions-tool";
import proposeCustomToolTool from "./propose-custom-tool-tool";
import proposeMcpServerTool from "./propose-mcp-server-tool";
import proposeSkillTool from "./propose-skill-tool";
import setExtensionAccessTool from "./set-extension-access-tool";
import updateCustomToolTool from "./update-custom-tool-tool";
import updateMcpServerTool from "./update-mcp-server-tool";
import updateSkillTool from "./update-skill-tool";

type Params = {
    user_id: number | string;
    bot_id: number | string;
    /**
     * The conversation a proposal is made in, where its card shows.
     */
    session_id: number | string;
    workspace_id?: number | string | null;
    /**
     * Called with each proposal's ref, so the reply carries its card.
     */
    onPropose?: (params: { ref: string }) => void;
};

/**
 * The coordinator's tools for the install's skills, MCP servers and custom
 * tools (what Settings has under Skills, MCPs and Tools): read them,
 * change what's safe directly (on or off, names and arguments that don't
 * change where anything is sent), propose adding one or changing what it
 * does (the user confirms from a card), delete one, and decide who gets
 * it. Only for the super admin, who alone defines
 * them; each tool checks again when it runs.
 */
export default async function grabCoordinatorExtensionTools(params: Params): Promise<HarnessTool[]> {
    const { user_id } = params;

    if ((await grabCrewRole({ user_id })) != "super_admin") return [];

    return [
        listExtensionsTool({ user_id }),
        proposeSkillTool(params),
        proposeMcpServerTool(params),
        proposeCustomToolTool(params),
        updateSkillTool({ user_id }),
        updateMcpServerTool({ user_id }),
        updateCustomToolTool({ user_id }),
        deleteExtensionTool({ user_id }),
        setExtensionAccessTool({ user_id }),
    ];
}

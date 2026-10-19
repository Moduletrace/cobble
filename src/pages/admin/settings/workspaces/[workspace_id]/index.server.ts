import type { PagePropsType, PageQueryObject } from "@/src/types";
import type { BunextPageServerFn } from "@moduletrace/bunext/types";
import grabBots from "@/src/functions/backend/db/bots/grab-bots";
import grabUserComputers from "@/src/functions/backend/db/computers/grab-user-computers";
import grabWorkspaceExtensionsOverview from "@/src/functions/backend/db/extensions/grab-workspace-extensions-overview";
import grabBotHarnessOverview from "@/src/functions/backend/db/harness/grab-bot-harness-overview";
import grabUserWorkspaces from "@/src/functions/backend/db/workspaces/grab-user-workspaces";
import grabWorkspaceBots from "@/src/functions/backend/db/workspaces/grab-workspace-bots";
import grabWorkspaceComputers from "@/src/functions/backend/db/workspaces/grab-workspace-computers";
import grabCrewSettingsServerProps from "../../(functions)/grab-crew-settings-server-props";

/**
 * One workspace's settings: its picture, details, bots, computers, tools
 * and MCP servers, and models. For super admins and admins.
 */
export const server: BunextPageServerFn<PagePropsType> = async (params) => {
    const settings = await grabCrewSettingsServerProps(params);

    if (!settings.props?.person?.id) return settings;

    const query: PageQueryObject = params.query;
    const user_id = settings.props.person.id;

    const workspaces = await grabUserWorkspaces({ user_id });
    const workspace = workspaces.find(
        (item) => String(item.id) == String(query.workspace_id),
    );

    if (!workspace?.id) {
        return {
            redirect: {
                destination: "/admin/settings/workspaces",
                permanent: false,
            },
        };
    }

    const workspace_id = Number(workspace.id);
    const [
        workspace_bots,
        all_bots,
        workspace_computers,
        computers,
        workspace_harness_overview,
        workspace_extensions,
    ] = await Promise.all([
        grabWorkspaceBots({ user_id, workspace_id }),
        grabBots({ user_id }),
        grabWorkspaceComputers({ workspace_id }),
        grabUserComputers({ user_id }),
        grabBotHarnessOverview({ workspace_id }).catch(() => null),
        grabWorkspaceExtensionsOverview({ user_id, workspace_id }),
    ]);

    return {
        props: {
            ...settings.props,
            workspaces,
            workspace,
            bots: workspace_bots,
            workspace_bots,
            all_bots,
            workspace_computers,
            computers,
            workspace_harness_overview,
            workspace_extensions,
        },
    };
};

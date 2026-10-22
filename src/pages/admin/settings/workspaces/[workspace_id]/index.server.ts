import type { PagePropsType, PageQueryObject } from "@/src/types";
import type { BunextPageServerFn } from "@moduletrace/bunext/types";
import grabBots from "@/src/functions/backend/db/bots/grab-bots";
import grabUserComputers from "@/src/functions/backend/db/computers/grab-user-computers";
import grabScopedEnvs from "@/src/functions/backend/db/envs/grab-scoped-envs";
import userAuth from "@/src/functions/backend/auth/user-auth";
import isPassThroughUser from "@/src/utils/rbac/is-pass-through-user";
import grabWorkspaceExtensionsOverview from "@/src/functions/backend/db/extensions/grab-workspace-extensions-overview";
import grabBotHarnessOverview from "@/src/functions/backend/db/harness/grab-bot-harness-overview";
import grabUserWorkspaces from "@/src/functions/backend/db/workspaces/grab-user-workspaces";
import grabWorkspaceBots from "@/src/functions/backend/db/workspaces/grab-workspace-bots";
import grabWorkspaceComputers from "@/src/functions/backend/db/workspaces/grab-workspace-computers";
import grabCrewSettingsServerProps from "../../(functions)/grab-crew-settings-server-props";
import railBots from "@/src/utils/rail-bots";
import railWorkspaces from "@/src/utils/rail-workspaces";

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
        workspace_envs,
    ] = await Promise.all([
        grabWorkspaceBots({ user_id, workspace_id }),
        grabBots({ user_id }),
        grabWorkspaceComputers({ workspace_id }),
        grabUserComputers({ user_id }),
        grabBotHarnessOverview({ workspace_id }).catch(() => null),
        grabWorkspaceExtensionsOverview({ user_id, workspace_id }),
        grabScopedEnvs({
            paradigm: "workspace",
            owner_id: workspace_id,
            user_id,
            can_manage: isPassThroughUser({
                user_types: (await userAuth({ req: params.req })).user_types,
            }),
        }),
    ]);

    const crew = railBots({ bots: workspace_bots });

    return {
        props: {
            ...settings.props,
            workspaces: railWorkspaces({ workspaces }),
            workspace,
            bots: crew,
            workspace_bots: crew,
            all_bots: railBots({ bots: all_bots }),
            workspace_computers,
            computers,
            workspace_harness_overview,
            workspace_extensions,
            workspace_envs,
        },
    };
};

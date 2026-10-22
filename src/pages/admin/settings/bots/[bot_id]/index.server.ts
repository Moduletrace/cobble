import type { PagePropsType, PageQueryObject, ComputerWithStatus } from "@/src/types";
import type { BunextPageServerFn } from "@moduletrace/bunext/types";
import grabBots from "@/src/functions/backend/db/bots/grab-bots";
import grabUserBot from "@/src/functions/backend/db/bots/grab-user-bot";
import grabBotComputers from "@/src/functions/backend/db/computers/grab-bot-computers";
import grabUserComputers from "@/src/functions/backend/db/computers/grab-user-computers";
import grabScopedEnvs from "@/src/functions/backend/db/envs/grab-scoped-envs";
import userAuth from "@/src/functions/backend/auth/user-auth";
import isPassThroughUser from "@/src/utils/rbac/is-pass-through-user";
import grabBotExtensionsOverview from "@/src/functions/backend/db/extensions/grab-bot-extensions-overview";
import grabBotHarnessOverview from "@/src/functions/backend/db/harness/grab-bot-harness-overview";
import grabHarnessOverview from "@/src/functions/backend/db/harness/grab-harness-overview";
import grabBotWorkspaces from "@/src/functions/backend/db/workspaces/grab-bot-workspaces";
import grabUserWorkspaces from "@/src/functions/backend/db/workspaces/grab-user-workspaces";
import grabCrewSettingsServerProps from "../../(functions)/grab-crew-settings-server-props";
import railBots from "@/src/utils/rail-bots";
import railWorkspaces from "@/src/utils/rail-workspaces";

/**
 * One bot's settings: its details, models, workspaces, computers, tools
 * and MCP servers. For
 * super admins and admins; the coordinator is the super admin's alone.
 */
export const server: BunextPageServerFn<PagePropsType> = async (params) => {
    const settings = await grabCrewSettingsServerProps(params);

    if (!settings.props?.person?.id) return settings;

    const query: PageQueryObject = params.query;
    const user_id = settings.props.person.id;

    const bot = await grabUserBot({ bot_id: String(query.bot_id), user_id });

    if (!bot?.id) {
        return { redirect: { destination: "/admin/settings/bots", permanent: false } };
    }

    const [
        bots,
        workspaces,
        bot_workspaces,
        all_computers,
        bot_computer_rows,
        bot_harness_overview,
        bot_extensions,
        bot_envs,
    ] = await Promise.all([
        grabBots({ user_id }),
        grabUserWorkspaces({ user_id }),
        grabBotWorkspaces({ user_id, bot }),
        grabUserComputers({ user_id }),
        grabBotComputers({ bot_id: bot.id }),
        (bot.kind == "coordinator"
            ? grabHarnessOverview().then(({ harnesses }) => ({ harnesses }))
            : grabBotHarnessOverview({ bot_id: bot.id })
        ).catch(() => null),
        grabBotExtensionsOverview({ user_id, bot_id: bot.id }),
        grabScopedEnvs({
            paradigm: "bot",
            owner_id: bot.id,
            user_id,
            can_manage: isPassThroughUser({
                user_types: (await userAuth({ req: params.req })).user_types,
            }),
        }),
    ]);

    const bot_computers = bot_computer_rows
        .map((row) =>
            all_computers.find((computer) => computer.id == row.id),
        )
        .filter((computer): computer is ComputerWithStatus =>
            Boolean(computer?.id),
        );

    return {
        props: {
            ...settings.props,
            bot,
            bots: railBots({ bots }),
            workspaces: railWorkspaces({ workspaces }),
            bot_workspaces,
            bot_computers,
            computers: all_computers,
            bot_harness_overview,
            bot_extensions,
            bot_envs,
        },
    };
};

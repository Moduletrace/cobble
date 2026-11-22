import type { PagePropsType, PageQueryObject } from "@/src/types";
import type { BunextPageServerFn } from "@moduletrace/bunext/types";
import userAuth from "@/src/functions/backend/auth/user-auth";
import grabBots from "@/src/functions/backend/db/bots/grab-bots";
import grabConnectorConnections from "@/src/functions/backend/db/connectors/grab-connector-connections";
import grabExtensionTargets from "@/src/functions/backend/db/extensions/grab-extension-targets";
import crewRole from "@/src/utils/rbac/crew-role";
import grabSettingsServerProps from "../../(functions)/grab-settings-server-props";

/**
 * One connection's apps, read a page at a time by the page itself. The
 * connection is looked up first, so an id that isn't here goes back to the
 * connections list rather than rendering an empty page.
 */
export const server: BunextPageServerFn<PagePropsType> = async (params) => {
    const settings = await grabSettingsServerProps(params);

    if (!settings.props?.person?.id) return settings;

    const query: PageQueryObject = params.query;
    const connection_id = Number(query["connector_id"]) || 0;

    const { user_types } = await userAuth({ req: params.req });
    const role = crewRole({ user_types });

    const [{ connections }, targets, bots] = await Promise.all([
        grabConnectorConnections(),
        grabExtensionTargets({ role }),
        grabBots({ user_id: settings.props.person.id }),
    ]);

    const connection = connections.find((item) => Number(item.id) == connection_id);

    if (!connection) {
        return {
            redirect: {
                destination: "/admin/settings/connectors",
                permanent: false,
            },
        };
    }

    return {
        props: {
            ...settings.props,
            connector_apps_page: {
                connection,
                targets,
                my_bots: bots.map((bot) => ({ id: Number(bot.id), name: String(bot.name || "") })),
            },
        },
    };
};
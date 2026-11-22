import type { PagePropsType } from "@/src/types";
import type { BunextPageServerFn } from "@moduletrace/bunext/types";
import userAuth from "@/src/functions/backend/auth/user-auth";
import grabConnectorConnections from "@/src/functions/backend/db/connectors/grab-connector-connections";
import grabExtensionTargets from "@/src/functions/backend/db/extensions/grab-extension-targets";
import crewRole from "@/src/utils/rbac/crew-role";
import grabSettingsServerProps from "../(functions)/grab-settings-server-props";

/**
 * Everyone's page: it lists the connections, and anyone signs in to their
 * own accounts per app. Only a super admin adds a connection, or gives one
 * to a workspace. Its apps are read on each connection's own page.
 */
export const server: BunextPageServerFn<PagePropsType> = async (params) => {
    const settings = await grabSettingsServerProps(params);

    if (!settings.props?.person?.id) return settings;

    const { user_types } = await userAuth({ req: params.req });
    const role = crewRole({ user_types });

    const [{ connections }, targets] = await Promise.all([
        grabConnectorConnections(),
        grabExtensionTargets({ role }),
    ]);

    return {
        props: {
            ...settings.props,
            connectors_page: { connections, targets },
        },
    };
};
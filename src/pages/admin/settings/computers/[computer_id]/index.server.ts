import type { PagePropsType, PageQueryObject } from "@/src/types";
import type { BunextPageServerFn } from "@moduletrace/bunext/types";
import grabBots from "@/src/functions/backend/db/bots/grab-bots";
import grabComputerAccess from "@/src/functions/backend/db/computers/grab-computer-access";
import grabUserComputer from "@/src/functions/backend/db/computers/grab-user-computer";
import grabUserComputers from "@/src/functions/backend/db/computers/grab-user-computers";
import grabUserWorkspaces from "@/src/functions/backend/db/workspaces/grab-user-workspaces";
import grabCrewSettingsServerProps from "../../(functions)/grab-crew-settings-server-props";

/**
 * One computer's settings: its state and resources, direct bot access,
 * linked workspaces, and retrying or deleting it. For super admins and
 * admins; only super admins edit, retry and delete.
 */
export const server: BunextPageServerFn<PagePropsType> = async (params) => {
    const settings = await grabCrewSettingsServerProps(params);

    if (!settings.props?.person?.id) return settings;

    const query: PageQueryObject = params.query;
    const user_id = settings.props.person.id;

    const allowed = await grabUserComputer({
        computer_id: String(query.computer_id),
        user_id,
    });

    if (!allowed?.id) {
        return {
            redirect: {
                destination: "/admin/settings/computers",
                permanent: false,
            },
        };
    }

    const [
        computer,
        bots,
        workspaces,
        access,
    ] = await Promise.all([
        grabUserComputers({ computer_id: allowed.id }).then(
            (rows) => rows[0] || allowed,
        ),
        grabBots({ user_id }),
        grabUserWorkspaces({ user_id }),
        grabComputerAccess({ computer_id: allowed.id }),
    ]);

    return {
        props: {
            ...settings.props,
            computer,
            bots,
            workspaces,
            computer_bots: access.bots,
            computer_workspaces: access.workspaces,
        },
    };
};

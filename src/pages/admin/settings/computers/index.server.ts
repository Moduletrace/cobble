import type { PagePropsType } from "@/src/types";
import type { BunextPageServerFn } from "@moduletrace/bunext/types";
import userAuth from "@/src/functions/backend/auth/user-auth";
import grabUserComputers from "@/src/functions/backend/db/computers/grab-user-computers";
import grabSshPublicKey from "@/src/functions/backend/db/computers/grab-ssh-public-key";
import isPassThroughUser from "@/src/utils/rbac/is-pass-through-user";
import grabCrewSettingsServerProps from "../(functions)/grab-crew-settings-server-props";

export const server: BunextPageServerFn<PagePropsType> = async (params) => {
    const settings = await grabCrewSettingsServerProps(params);

    if (!settings.props?.person?.id) return settings;

    const { user_types } = await userAuth({ req: params.req });
    const is_super = isPassThroughUser({ user_types });
    const public_key = is_super ? await grabSshPublicKey() : null;

    return {
        props: {
            ...settings.props,
            computers: await grabUserComputers({ user_id: settings.props.person.id }),
            ssh_key: is_super ? { set: Boolean(public_key), public_key } : null,
        },
    };
};

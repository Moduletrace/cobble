import grabCrewRole from "../access/grab-crew-role";
import grabUserBot from "../bots/grab-user-bot";
import grabUserWorkspace from "../workspaces/grab-user-workspace";

type Params = {
    scope?: string | null;
    owner_id?: number | string | null;
    user_id: number | string;
};

/**
 * Whether a user reaches a bot file's directory: the workspace it's shared
 * in, or the bot's own (any bot for the super admin, else the bots the user
 * reaches). Files belong to the install, like the crew, so whoever sees the
 * bot sees what it saved.
 */
export default async function userReachesFileScope({ scope, owner_id, user_id }: Params) {
    if (!owner_id) return false;

    if (scope == "workspace") {
        return Boolean(await grabUserWorkspace({ workspace_id: owner_id, user_id }));
    }

    if ((await grabCrewRole({ user_id })) == "super_admin") return true;

    return Boolean(await grabUserBot({ bot_id: owner_id, user_id }));
}

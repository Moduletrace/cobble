import userAuth from "@/src/functions/backend/auth/user-auth";
import grabTasks from "@/src/functions/backend/db/tasks/grab-tasks";
import type { TaskWithNames } from "@/src/types";
import safeErrorMessage from "@/src/utils/safe-error-message";
import type { APIResponseObject, BunextAPIRouteHandler } from "@moduletrace/bunext/types";

/**
 * The user's tasks: a bot's own list (`?bot_id=`), a workspace's
 * (`?workspace_id=`), one bot's there with the unassigned ones
 * (`?workspace_id=&bot_id=`), or every task they reach. `?status=` narrows to one
 * status, `?open=1` to the open ones.
 */
export const handler: BunextAPIRouteHandler<APIResponseObject<TaskWithNames>> = async ({ req }) => {
    try {
        if (req.method != "GET") {
            return { success: false, msg: `Method not allowed` };
        }

        const { user } = await userAuth({ req });

        if (!user?.logged_in_status || !user.id) {
            return { success: false, msg: `Unauthorized`, logoutUser: true };
        }

        const url = new URL(req.url);
        const bot_id = Number(url.searchParams.get("bot_id")) || undefined;
        const workspace_id = Number(url.searchParams.get("workspace_id")) || undefined;
        const status = url.searchParams.get("status") || undefined;
        const open = url.searchParams.get("open") == "1";

        return {
            success: true,
            payload: await grabTasks({
                user_id: user.id,
                only_bot_id: bot_id,
                with_unassigned: Boolean(bot_id && workspace_id),
                only_workspace_id: workspace_id,
                own_list: Boolean(bot_id && !workspace_id),
                statuses: status ? [status] : undefined,
                open_only: open,
            }),
        };
    } catch (error: unknown) {
        return { success: false, msg: safeErrorMessage({ error }) };
    }
};

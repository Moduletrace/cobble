import userAuth from "@/src/functions/backend/auth/user-auth";
import grabBots from "@/src/functions/backend/db/bots/grab-bots";
import grabUserWorkspaces from "@/src/functions/backend/db/workspaces/grab-user-workspaces";
import { LiveCrewRequestSchema } from "@/src/schemas/bot-schema";
import type { LiveCrewPayload } from "@/src/types";
import AppError from "@/src/utils/app-error";
import parseWithSchema from "@/src/utils/parse-with-schema";
import railBots from "@/src/utils/rail-bots";
import railWorkspaces from "@/src/utils/rail-workspaces";
import safeErrorMessage from "@/src/utils/safe-error-message";
import type {
    APIResponseObject,
    BunextAPIRouteHandler,
} from "@moduletrace/bunext/types";

/**
 * The crew the rail lists, as it stands now (`grabBots` in a workspace or
 * for the bots' own chats, and the user's workspaces), cut down the way the
 * page's props are. Read again on every return to the page, so a push that
 * never arrived (a phone asleep, a socket that dropped silently) can't
 * leave a face, an unread mark or a latest message behind. The figure the
 * lists show is all this returns: no prompts or memories.
 */
export const handler: BunextAPIRouteHandler<APIResponseObject<LiveCrewPayload>> =
    async ({ req, body }) => {
        try {
            if (req.method != "POST") {
                throw new AppError(`Method not allowed`);
            }

            const { user } = await userAuth({ req });

            if (!user?.logged_in_status || !user.id) {
                return { success: false, msg: `Unauthorized`, logoutUser: true };
            }

            const { workspace_id } = parseWithSchema({
                schema: LiveCrewRequestSchema,
                data: body,
            });

            const user_id = Number(user.id);

            const [bots, workspaces] = await Promise.all([
                grabBots({ user_id, workspace_id }),
                grabUserWorkspaces({ user_id }),
            ]);

            return {
                success: true,
                singleRes: {
                    bots: railBots({ bots }),
                    workspaces: railWorkspaces({ workspaces }),
                },
            };
        } catch (error: unknown) {
            return { success: false, msg: safeErrorMessage({ error }) };
        }
    };
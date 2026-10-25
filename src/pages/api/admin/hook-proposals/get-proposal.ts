import userAuth from "@/src/functions/backend/auth/user-auth";
import grabHookProposalView from "@/src/functions/backend/db/hook-proposals/grab-hook-proposal-view";
import { HookProposalIdRequestSchema } from "@/src/schemas/bot-hook-schema";
import type { HookProposalView } from "@/src/types";
import AppError from "@/src/utils/app-error";
import parseWithSchema from "@/src/utils/parse-with-schema";
import safeErrorMessage from "@/src/utils/safe-error-message";
import type { APIResponseObject, BunextAPIRouteHandler } from "@moduletrace/bunext/types";

/**
 * `GET ?proposal_id=`: a hook a bot proposed to the session user, as its
 * chip and confirm card show it. Nobody else reads it.
 */
export const handler: BunextAPIRouteHandler<APIResponseObject<HookProposalView>> = async ({ req, query }) => {
    try {
        if (req.method != "GET") {
            throw new AppError(`Method not allowed`);
        }

        const { user } = await userAuth({ req });

        if (!user?.logged_in_status || !user.id) {
            return { success: false, msg: `Unauthorized`, logoutUser: true };
        }

        const { proposal_id } = parseWithSchema({ schema: HookProposalIdRequestSchema, data: query });

        return { success: true, singleRes: await grabHookProposalView({ proposal_id, user_id: user.id }) };
    } catch (error: unknown) {
        return { success: false, msg: safeErrorMessage({ error }) };
    }
};

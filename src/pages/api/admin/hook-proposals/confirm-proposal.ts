import userAuth from "@/src/functions/backend/auth/user-auth";
import confirmHookProposal from "@/src/functions/backend/db/hook-proposals/confirm-hook-proposal";
import grabHookProposalView from "@/src/functions/backend/db/hook-proposals/grab-hook-proposal-view";
import logEvent, { grabRequestIP } from "@/src/functions/backend/logger";
import { HookProposalIdRequestSchema } from "@/src/schemas/bot-hook-schema";
import type { HookProposalDecision } from "@/src/types";
import AppError from "@/src/utils/app-error";
import parseWithSchema from "@/src/utils/parse-with-schema";
import isReadOnlyUser from "@/src/utils/rbac/is-read-only-user";
import safeErrorMessage from "@/src/utils/safe-error-message";
import type { APIResponseObject, BunextAPIRouteHandler } from "@moduletrace/bunext/types";

/**
 * Confirms a hook a bot proposed to the session user, which makes or
 * changes it as theirs. Returns the proposal with its outcome (which the
 * card then tells the bot in chat) and a new hook's token, shown this
 * once on the card and never to the bot.
 */
export const handler: BunextAPIRouteHandler<APIResponseObject<HookProposalDecision>> = async ({ req, body }) => {
    try {
        if (req.method != "POST") {
            throw new AppError(`Method not allowed`);
        }

        const { user, user_types } = await userAuth({ req });

        if (!user?.logged_in_status || !user.id) {
            return { success: false, msg: `Unauthorized`, logoutUser: true };
        }

        if (isReadOnlyUser({ user_types: user_types || [] })) {
            throw new AppError(`This user can only read records.`);
        }

        const { proposal_id } = parseWithSchema({ schema: HookProposalIdRequestSchema, data: body });
        const { proposal, token } = await confirmHookProposal({ user_id: user.id, proposal_id });
        const view = await grabHookProposalView({ proposal_id, user_id: user.id });

        await logEvent({
            title: view.status == "failed" ? "Hook proposal failed" : "Hook proposal confirmed",
            category: "hook",
            user_id: user.id,
            plain_text: `User #${user.id} confirmed the hook proposal #${proposal.id} (${proposal.action} "${proposal.title}") from bot #${proposal.bot_id}: ${view.outcome}`,
            metadata: { proposal_id: proposal.id, action: proposal.action, bot_id: proposal.bot_id, hook_id: view.result_id },
            ip_address: grabRequestIP(req),
        });

        return { success: true, msg: view.outcome, singleRes: { view, token } };
    } catch (error: unknown) {
        return { success: false, msg: safeErrorMessage({ error }) };
    }
};

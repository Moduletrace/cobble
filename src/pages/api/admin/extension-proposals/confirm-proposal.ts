import grabSuperAdminUser from "@/src/functions/backend/backups/grab-super-admin-user";
import confirmExtensionProposal from "@/src/functions/backend/db/extension-proposals/confirm-extension-proposal";
import grabExtensionProposalView from "@/src/functions/backend/db/extension-proposals/grab-extension-proposal-view";
import logEvent, { grabRequestIP } from "@/src/functions/backend/logger";
import { ExtensionProposalIdRequestSchema } from "@/src/schemas/extension-schema";
import type { ExtensionProposalView } from "@/src/types";
import AppError from "@/src/utils/app-error";
import parseWithSchema from "@/src/utils/parse-with-schema";
import safeErrorMessage from "@/src/utils/safe-error-message";
import type { APIResponseObject, BunextAPIRouteHandler } from "@moduletrace/bunext/types";

/**
 * Super admin only: confirms an MCP server or tool the coordinator
 * proposed, which saves it (switched off while a key it sends is missing)
 * and connects a server. Returns the proposal with its outcome, which the
 * card then tells the bot in chat.
 */
export const handler: BunextAPIRouteHandler<APIResponseObject<ExtensionProposalView>> = async ({ req, body }) => {
    try {
        if (req.method != "POST") {
            throw new AppError(`Method not allowed`);
        }

        const user = await grabSuperAdminUser({ req });

        if (!user?.id) {
            throw new AppError(`Only a super admin can do that.`);
        }

        const { proposal_id } = parseWithSchema({ schema: ExtensionProposalIdRequestSchema, data: body });
        const proposal = await confirmExtensionProposal({ user_id: user.id, proposal_id });
        const view = await grabExtensionProposalView({ proposal_id, user_id: user.id });

        await logEvent({
            title: view.status == "failed" ? "Proposal failed" : "Proposal confirmed",
            category: "system",
            user_id: user.id,
            plain_text: `User #${user.id} confirmed the proposal #${proposal.id} (${proposal.kind} ${proposal.name}): ${view.outcome}`,
            metadata: { proposal_id: proposal.id, kind: proposal.kind, result_id: view.result_id, host: view.host },
            ip_address: grabRequestIP(req),
        });

        return { success: true, msg: view.outcome, singleRes: view };
    } catch (error: unknown) {
        return { success: false, msg: safeErrorMessage({ error }) };
    }
};

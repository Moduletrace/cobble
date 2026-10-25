import grabSuperAdminUser from "@/src/functions/backend/backups/grab-super-admin-user";
import grabExtensionProposalView from "@/src/functions/backend/db/extension-proposals/grab-extension-proposal-view";
import rejectExtensionProposal from "@/src/functions/backend/db/extension-proposals/reject-extension-proposal";
import logEvent, { grabRequestIP } from "@/src/functions/backend/logger";
import { ExtensionProposalIdRequestSchema } from "@/src/schemas/extension-schema";
import type { ExtensionProposalView } from "@/src/types";
import AppError from "@/src/utils/app-error";
import parseWithSchema from "@/src/utils/parse-with-schema";
import safeErrorMessage from "@/src/utils/safe-error-message";
import type { APIResponseObject, BunextAPIRouteHandler } from "@moduletrace/bunext/types";

/**
 * Super admin only: rejects an MCP server or tool the coordinator
 * proposed. Nothing is saved.
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
        const proposal = await rejectExtensionProposal({ user_id: user.id, proposal_id });

        await logEvent({
            title: "Proposal rejected",
            category: "system",
            user_id: user.id,
            plain_text: `User #${user.id} rejected the proposal #${proposal.id} (${proposal.kind} ${proposal.name}).`,
            metadata: { proposal_id: proposal.id, kind: proposal.kind },
            ip_address: grabRequestIP(req),
        });

        return { success: true, singleRes: await grabExtensionProposalView({ proposal_id, user_id: user.id }) };
    } catch (error: unknown) {
        return { success: false, msg: safeErrorMessage({ error }) };
    }
};

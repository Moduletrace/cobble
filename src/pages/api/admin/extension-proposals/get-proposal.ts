import grabSuperAdminUser from "@/src/functions/backend/backups/grab-super-admin-user";
import grabExtensionProposalView from "@/src/functions/backend/db/extension-proposals/grab-extension-proposal-view";
import { ExtensionProposalIdRequestSchema } from "@/src/schemas/extension-schema";
import type { ExtensionProposalView } from "@/src/types";
import AppError from "@/src/utils/app-error";
import parseWithSchema from "@/src/utils/parse-with-schema";
import safeErrorMessage from "@/src/utils/safe-error-message";
import type { APIResponseObject, BunextAPIRouteHandler } from "@moduletrace/bunext/types";

/**
 * `GET ?proposal_id=`, super admin only: an MCP server or tool the
 * coordinator proposed to them, as its chip and confirm card show it.
 */
export const handler: BunextAPIRouteHandler<APIResponseObject<ExtensionProposalView>> = async ({ req, query }) => {
    try {
        if (req.method != "GET") {
            throw new AppError(`Method not allowed`);
        }

        const user = await grabSuperAdminUser({ req });

        if (!user?.id) {
            throw new AppError(`Only a super admin can do that.`);
        }

        const { proposal_id } = parseWithSchema({ schema: ExtensionProposalIdRequestSchema, data: query });

        return { success: true, singleRes: await grabExtensionProposalView({ proposal_id, user_id: user.id }) };
    } catch (error: unknown) {
        return { success: false, msg: safeErrorMessage({ error }) };
    }
};

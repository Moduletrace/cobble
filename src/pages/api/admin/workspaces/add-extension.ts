import userAuth from "@/src/functions/backend/auth/user-auth";
import grabWorkspaceExtensionsOverview from "@/src/functions/backend/db/extensions/grab-workspace-extensions-overview";
import setWorkspaceExtension from "@/src/functions/backend/db/extensions/set-workspace-extension";
import logEvent, { grabRequestIP } from "@/src/functions/backend/logger";
import { SetWorkspaceExtensionRequestSchema } from "@/src/schemas/extension-schema";
import type { BotExtensionsPayload } from "@/src/types";
import AppError from "@/src/utils/app-error";
import parseWithSchema from "@/src/utils/parse-with-schema";
import isReadOnlyUser from "@/src/utils/rbac/is-read-only-user";
import extensionNoun, { extensionLogTitle } from "@/src/utils/extension-noun";
import safeErrorMessage from "@/src/utils/safe-error-message";
import type {
    APIResponseObject,
    BunextAPIRouteHandler,
} from "@moduletrace/bunext/types";

/**
 * Super admins and admins: gives a workspace an MCP server or tool, which
 * every bot working there gets, there.
 */
export const handler: BunextAPIRouteHandler<APIResponseObject<BotExtensionsPayload>> = async ({ req, body }) => {
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

        const { workspace_id, kind, id } = parseWithSchema({ schema: SetWorkspaceExtensionRequestSchema, data: body });
        const { workspace, name } = await setWorkspaceExtension({ user_id: user.id, workspace_id, kind, id, attached: true });

        await logEvent({
            title: extensionLogTitle({ kind, verb: "added" }),
            category: "system",
            user_id: user.id,
            plain_text: `User #${user.id} gave ${extensionNoun({ kind, article: true })} ${name} to the workspace ${workspace.name} (#${workspace.id}).`,
            metadata: { workspace_id, kind, id },
            ip_address: grabRequestIP(req),
        });

        return {
            success: true,
            msg: `Added ${name}.`,
            singleRes: await grabWorkspaceExtensionsOverview({ user_id: user.id, workspace_id }),
        };
    } catch (error: unknown) {
        return { success: false, msg: safeErrorMessage({ error }) };
    }
};

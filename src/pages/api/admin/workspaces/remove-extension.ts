import userAuth from "@/src/functions/backend/auth/user-auth";
import grabWorkspaceExtensionsOverview from "@/src/functions/backend/db/extensions/grab-workspace-extensions-overview";
import setWorkspaceExtension from "@/src/functions/backend/db/extensions/set-workspace-extension";
import logEvent, { grabRequestIP } from "@/src/functions/backend/logger";
import { SetWorkspaceExtensionRequestSchema } from "@/src/schemas/extension-schema";
import type { BotExtensionsPayload } from "@/src/types";
import AppError from "@/src/utils/app-error";
import parseWithSchema from "@/src/utils/parse-with-schema";
import isReadOnlyUser from "@/src/utils/rbac/is-read-only-user";
import safeErrorMessage from "@/src/utils/safe-error-message";
import type {
    APIResponseObject,
    BunextAPIRouteHandler,
} from "@moduletrace/bunext/types";

/**
 * Super admins and admins: takes an MCP server or tool from a workspace.
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
        const { workspace, name } = await setWorkspaceExtension({ user_id: user.id, workspace_id, kind, id, attached: false });

        await logEvent({
            title: "Workspace tool removed",
            category: "system",
            user_id: user.id,
            plain_text: `User #${user.id} took ${kind == "mcp" ? "the MCP server" : "the tool"} ${name} from the workspace ${workspace.name} (#${workspace.id}).`,
            metadata: { workspace_id, kind, id },
            ip_address: grabRequestIP(req),
        });

        return {
            success: true,
            msg: `Removed ${name}.`,
            singleRes: await grabWorkspaceExtensionsOverview({ user_id: user.id, workspace_id }),
        };
    } catch (error: unknown) {
        return { success: false, msg: safeErrorMessage({ error }) };
    }
};

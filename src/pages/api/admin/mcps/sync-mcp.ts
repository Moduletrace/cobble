import grabSuperAdminUser from "@/src/functions/backend/backups/grab-super-admin-user";
import grabMcpsOverview from "@/src/functions/backend/db/extensions/grab-mcps-overview";
import syncMcpServer from "@/src/functions/backend/db/extensions/sync-mcp-server";
import { SyncMcpServerRequestSchema } from "@/src/schemas/extension-schema";
import logEvent, { grabRequestIP } from "@/src/functions/backend/logger";
import type { McpServersOverviewPayload } from "@/src/types";
import AppError from "@/src/utils/app-error";
import parseWithSchema from "@/src/utils/parse-with-schema";
import safeErrorMessage from "@/src/utils/safe-error-message";
import type {
    APIResponseObject,
    BunextAPIRouteHandler,
} from "@moduletrace/bunext/types";

/**
 * Super admin only: lists an MCP server's tools again, optionally running
 * a stdio server's setup again first (Reinstall).
 */
export const handler: BunextAPIRouteHandler<
    APIResponseObject<McpServersOverviewPayload>
> = async ({ req, body }) => {
    try {
        if (req.method != "POST") {
            throw new AppError(`Method not allowed`);
        }

        const user = await grabSuperAdminUser({ req });

        if (!user?.id) {
            throw new AppError(`Only a super admin can do that.`);
        }

        const { mcp_server_id, reinstall } = parseWithSchema({ schema: SyncMcpServerRequestSchema, data: body });
        const sync = await syncMcpServer({ mcp_server_id, reinstall });

        if (reinstall) {
            await logEvent({
                title: "MCP server reinstalled",
                category: "system",
                user_id: user.id,
                plain_text: `User #${user.id} reinstalled the MCP server #${mcp_server_id}.`,
                metadata: { mcp_server_id },
                ip_address: grabRequestIP(req),
            });
        }

        return {
            success: true,
            msg: sync.ok
                ? `Connected: ${sync.tools.length} ${sync.tools.length == 1 ? "tool" : "tools"}.`
                : `It didn't connect.`,
            singleRes: await grabMcpsOverview({ user_id: user.id }),
        };
    } catch (error: unknown) {
        return { success: false, msg: safeErrorMessage({ error }) };
    }
};

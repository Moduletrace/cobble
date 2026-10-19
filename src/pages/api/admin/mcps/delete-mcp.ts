import grabSuperAdminUser from "@/src/functions/backend/backups/grab-super-admin-user";
import deleteMcpServer from "@/src/functions/backend/db/extensions/delete-mcp-server";
import grabMcpsOverview from "@/src/functions/backend/db/extensions/grab-mcps-overview";
import { McpServerIdRequestSchema } from "@/src/schemas/extension-schema";
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
 * Super admin only: deletes an MCP server. Bots lose its tools at once.
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

        const { mcp_server_id } = parseWithSchema({ schema: McpServerIdRequestSchema, data: body });
        const server = await deleteMcpServer({ mcp_server_id });

        await logEvent({
            title: "MCP server deleted",
            category: "system",
            user_id: user.id,
            plain_text: `User #${user.id} deleted the MCP server ${server.name} (#${server.id}).`,
            metadata: { mcp_server_id },
            ip_address: grabRequestIP(req),
        });

        return {
            success: true,
            msg: `Deleted ${server.name}.`,
            singleRes: await grabMcpsOverview({ user_id: user.id }),
        };
    } catch (error: unknown) {
        return { success: false, msg: safeErrorMessage({ error }) };
    }
};

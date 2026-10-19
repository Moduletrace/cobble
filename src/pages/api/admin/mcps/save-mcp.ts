import grabSuperAdminUser from "@/src/functions/backend/backups/grab-super-admin-user";
import grabMcpsOverview from "@/src/functions/backend/db/extensions/grab-mcps-overview";
import saveMcpServer from "@/src/functions/backend/db/extensions/save-mcp-server";
import syncMcpServer from "@/src/functions/backend/db/extensions/sync-mcp-server";
import { SaveMcpServerRequestSchema } from "@/src/schemas/extension-schema";
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
 * Super admin only: adds or edits an MCP server, then lists its tools
 * (starting a stdio one after its setup) so bots can use them.
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

        const data = parseWithSchema({ schema: SaveMcpServerRequestSchema, data: body });
        const mcp_server_id = await saveMcpServer({ user_id: user.id, data });
        const sync = data.enabled ? await syncMcpServer({ mcp_server_id }) : null;

        await logEvent({
            title: data.mcp_server_id ? "MCP server changed" : "MCP server added",
            category: "system",
            user_id: user.id,
            plain_text: `User #${user.id} ${data.mcp_server_id ? "changed" : "added"} the MCP server ${data.name} (#${mcp_server_id}, ${data.transport}).`,
            metadata: { mcp_server_id, transport: data.transport },
            ip_address: grabRequestIP(req),
        });

        return {
            success: true,
            msg: !sync
                ? `Saved ${data.name}. It's off.`
                : sync.ok
                  ? `Saved ${data.name}: ${sync.tools.length} ${sync.tools.length == 1 ? "tool" : "tools"}.`
                  : `Saved ${data.name}, but it didn't connect.`,
            singleRes: await grabMcpsOverview({ user_id: user.id }),
        };
    } catch (error: unknown) {
        return { success: false, msg: safeErrorMessage({ error }) };
    }
};

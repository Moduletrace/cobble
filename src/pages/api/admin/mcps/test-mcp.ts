import grabSuperAdminUser from "@/src/functions/backend/backups/grab-super-admin-user";
import testMcpDraft from "@/src/functions/backend/db/extensions/test-mcp-draft";
import { TestMcpServerRequestSchema } from "@/src/schemas/extension-schema";
import type { McpServerTestPayload } from "@/src/types";
import AppError from "@/src/utils/app-error";
import parseWithSchema from "@/src/utils/parse-with-schema";
import safeErrorMessage from "@/src/utils/safe-error-message";
import type {
    APIResponseObject,
    BunextAPIRouteHandler,
} from "@moduletrace/bunext/types";

/**
 * Super admin only: connects to an MCP server as the form has it, saved or
 * not, and returns its tools or why it didn't connect. Nothing is saved.
 */
export const handler: BunextAPIRouteHandler<
    APIResponseObject<McpServerTestPayload>
> = async ({ req, body }) => {
    try {
        if (req.method != "POST") {
            throw new AppError(`Method not allowed`);
        }

        const user = await grabSuperAdminUser({ req });

        if (!user?.id) {
            throw new AppError(`Only a super admin can do that.`);
        }

        const data = parseWithSchema({ schema: TestMcpServerRequestSchema, data: body });
        const result = await testMcpDraft({ data });

        return {
            success: true,
            msg: result.ok
                ? `Connected: ${result.tools.length} ${result.tools.length == 1 ? "tool" : "tools"}.`
                : `Couldn't connect.`,
            singleRes: result.ok ? { ok: true, tools: result.tools } : { ok: false, tools: [], error: result.error },
        };
    } catch (error: unknown) {
        return { success: false, msg: safeErrorMessage({ error }) };
    }
};

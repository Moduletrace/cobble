import grabSuperAdminUser from "@/src/functions/backend/backups/grab-super-admin-user";
import grabToolsOverview from "@/src/functions/backend/db/extensions/grab-tools-overview";
import testCustomTool from "@/src/functions/backend/db/extensions/test-custom-tool";
import { TestCustomToolRequestSchema } from "@/src/schemas/extension-schema";
import logEvent, { grabRequestIP } from "@/src/functions/backend/logger";
import type { CustomToolTestPayload } from "@/src/types";
import AppError from "@/src/utils/app-error";
import parseWithSchema from "@/src/utils/parse-with-schema";
import safeErrorMessage from "@/src/utils/safe-error-message";
import type {
    APIResponseObject,
    BunextAPIRouteHandler,
} from "@moduletrace/bunext/types";

/**
 * Super admin only: runs a custom tool (saved, or as its form has it)
 * once with sample arguments and
 * returns what a bot would read, with the page data (its new status).
 */
export const handler: BunextAPIRouteHandler<
    APIResponseObject<CustomToolTestPayload>
> = async ({ req, body }) => {
    try {
        if (req.method != "POST") {
            throw new AppError(`Method not allowed`);
        }

        const user = await grabSuperAdminUser({ req });

        if (!user?.id) {
            throw new AppError(`Only a super admin can do that.`);
        }

        const { custom_tool_id, draft, args, computer_id } = parseWithSchema({ schema: TestCustomToolRequestSchema, data: body });
        const { output, ok } = await testCustomTool({ custom_tool_id, draft, args, computer_id });

        await logEvent({
            title: "Tool tried",
            category: "system",
            user_id: user.id,
            plain_text: `User #${user.id} tried ${custom_tool_id ? `the tool #${custom_tool_id}` : "a tool's draft"}.`,
            metadata: { custom_tool_id },
            ip_address: grabRequestIP(req),
        });

        return {
            success: true,
            msg: ok ? "It worked." : "It failed.",
            singleRes: { output, ok, overview: await grabToolsOverview({ user_id: user.id }) },
        };
    } catch (error: unknown) {
        return { success: false, msg: safeErrorMessage({ error }) };
    }
};

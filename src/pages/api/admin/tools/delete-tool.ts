import grabSuperAdminUser from "@/src/functions/backend/backups/grab-super-admin-user";
import deleteCustomTool from "@/src/functions/backend/db/extensions/delete-custom-tool";
import grabToolsOverview from "@/src/functions/backend/db/extensions/grab-tools-overview";
import { CustomToolIdRequestSchema } from "@/src/schemas/extension-schema";
import logEvent, { grabRequestIP } from "@/src/functions/backend/logger";
import type { CustomToolsOverviewPayload } from "@/src/types";
import AppError from "@/src/utils/app-error";
import parseWithSchema from "@/src/utils/parse-with-schema";
import safeErrorMessage from "@/src/utils/safe-error-message";
import type {
    APIResponseObject,
    BunextAPIRouteHandler,
} from "@moduletrace/bunext/types";

/**
 * Super admin only: deletes a custom tool. Bots lose it at once.
 */
export const handler: BunextAPIRouteHandler<
    APIResponseObject<CustomToolsOverviewPayload>
> = async ({ req, body }) => {
    try {
        if (req.method != "POST") {
            throw new AppError(`Method not allowed`);
        }

        const user = await grabSuperAdminUser({ req });

        if (!user?.id) {
            throw new AppError(`Only a super admin can do that.`);
        }

        const { custom_tool_id } = parseWithSchema({ schema: CustomToolIdRequestSchema, data: body });
        const tool = await deleteCustomTool({ custom_tool_id });

        await logEvent({
            title: "Tool deleted",
            category: "system",
            user_id: user.id,
            plain_text: `User #${user.id} deleted the tool ${tool.name} (#${tool.id}).`,
            metadata: { custom_tool_id },
            ip_address: grabRequestIP(req),
        });

        return {
            success: true,
            msg: `Deleted ${tool.name}.`,
            singleRes: await grabToolsOverview({ user_id: user.id }),
        };
    } catch (error: unknown) {
        return { success: false, msg: safeErrorMessage({ error }) };
    }
};

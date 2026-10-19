import grabSuperAdminUser from "@/src/functions/backend/backups/grab-super-admin-user";
import grabToolsOverview from "@/src/functions/backend/db/extensions/grab-tools-overview";
import saveCustomTool from "@/src/functions/backend/db/extensions/save-custom-tool";
import { SaveCustomToolRequestSchema } from "@/src/schemas/extension-schema";
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
 * Super admin only: adds or edits a custom tool.
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

        const data = parseWithSchema({ schema: SaveCustomToolRequestSchema, data: body });
        const custom_tool_id = await saveCustomTool({ user_id: user.id, data });

        await logEvent({
            title: data.custom_tool_id ? "Tool changed" : "Tool added",
            category: "system",
            user_id: user.id,
            plain_text: `User #${user.id} ${data.custom_tool_id ? "changed" : "added"} the tool ${data.name} (#${custom_tool_id}, ${data.kind}).`,
            metadata: { custom_tool_id, kind: data.kind },
            ip_address: grabRequestIP(req),
        });

        return {
            success: true,
            msg: `Saved ${data.name}.`,
            singleRes: await grabToolsOverview({ user_id: user.id }),
        };
    } catch (error: unknown) {
        return { success: false, msg: safeErrorMessage({ error }) };
    }
};

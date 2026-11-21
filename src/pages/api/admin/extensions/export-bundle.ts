import grabSuperAdminUser from "@/src/functions/backend/backups/grab-super-admin-user";
import exportExtensions from "@/src/functions/backend/db/extension-bundles/export-extensions";
import logEvent, { grabRequestIP } from "@/src/functions/backend/logger";
import { ExportExtensionBundleRequestSchema } from "@/src/schemas/extension-bundle-schema";
import type { ExtensionBundle } from "@/src/types";
import AppError from "@/src/utils/app-error";
import parseWithSchema from "@/src/utils/parse-with-schema";
import safeErrorMessage from "@/src/utils/safe-error-message";
import type { APIResponseObject, BunextAPIRouteHandler } from "@moduletrace/bunext/types";

const Labels = {
    mcp: ["MCP server", "MCP servers"],
    tool: ["tool", "tools"],
    skill: ["skill", "skills"],
    knowledgebase: ["knowledgebase", "knowledgebases"],
};

/**
 * Super admin only: one page's extensions (the ones picked, or all of them)
 * as a JSON bundle another install can import. Never a key: a server's own
 * header and env values stay behind and the bundle says which.
 */
export const handler: BunextAPIRouteHandler<APIResponseObject<ExtensionBundle>> = async ({ req, body }) => {
    try {
        if (req.method != "POST") {
            throw new AppError(`Method not allowed`);
        }

        const user = await grabSuperAdminUser({ req });

        if (!user?.id) {
            throw new AppError(`Only a super admin can do that.`);
        }

        const data = parseWithSchema({ schema: ExportExtensionBundleRequestSchema, data: body });
        const bundle = await exportExtensions({ kind: data.kind, ids: data.ids });
        const [one, many] = Labels[data.kind];
        const redacted = bundle.items.reduce((total, item) => total + item.redacted.length, 0);

        await logEvent({
            title: "Extensions exported",
            category: "system",
            user_id: user.id,
            plain_text: `User #${user.id} exported ${bundle.items.length} ${bundle.items.length == 1 ? one : many}${
                redacted ? `, leaving ${redacted} ${redacted == 1 ? "value" : "values"} behind` : ""
            }.`,
            metadata: { kind: data.kind, items: bundle.items.length, redacted },
            ip_address: grabRequestIP(req),
        });

        return {
            success: true,
            msg: `${bundle.items.length} ${bundle.items.length == 1 ? one : many} exported.`,
            singleRes: bundle,
        };
    } catch (error: unknown) {
        return { success: false, msg: safeErrorMessage({ error }) };
    }
};
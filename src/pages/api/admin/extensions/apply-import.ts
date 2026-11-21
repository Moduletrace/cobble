import grabSuperAdminUser from "@/src/functions/backend/backups/grab-super-admin-user";
import applyExtensionImport from "@/src/functions/backend/db/extension-bundles/apply-extension-import";
import logEvent, { grabRequestIP } from "@/src/functions/backend/logger";
import { ApplyExtensionImportRequestSchema } from "@/src/schemas/extension-bundle-schema";
import type { ExtensionImportApplyPayload } from "@/src/types";
import AppError from "@/src/utils/app-error";
import parseWithSchema from "@/src/utils/parse-with-schema";
import safeErrorMessage from "@/src/utils/safe-error-message";
import type { APIResponseObject, BunextAPIRouteHandler, BunextServerRouteConfig } from "@moduletrace/bunext/types";

export const config: BunextServerRouteConfig = {
    max_request_body_mb: 200,
};

/**
 * Super admin only: writes a bundle's items of one kind, as the preview
 * showed, and answers with what each did and the page's list again.
 */
export const handler: BunextAPIRouteHandler<APIResponseObject<ExtensionImportApplyPayload>> = async ({
    req,
    body,
}) => {
    try {
        if (req.method != "POST") {
            throw new AppError(`Method not allowed`);
        }

        const user = await grabSuperAdminUser({ req });

        if (!user?.id) {
            throw new AppError(`Only a super admin can do that.`);
        }

        const data = parseWithSchema({ schema: ApplyExtensionImportRequestSchema, data: body });
        const payload = await applyExtensionImport({
            bundle: data.bundle,
            kind: data.kind,
            decisions: data.decisions,
            user_id: user.id,
        });

        const added = payload.outcomes.filter((outcome) => outcome.ok && outcome.action != "skip").length;
        const failed = payload.outcomes.filter((outcome) => !outcome.ok).length;

        await logEvent({
            title: "Extensions imported",
            category: "system",
            user_id: user.id,
            plain_text: `User #${user.id} imported ${added} ${data.kind} item${added == 1 ? "" : "s"}${
                failed ? `, ${failed} of them failing` : ""
            }.`,
            metadata: { kind: data.kind, added, failed },
            ip_address: grabRequestIP(req),
        });

        return {
            success: true,
            msg: failed
                ? `${added} imported, ${failed} not.`
                : `${added} ${added == 1 ? "item" : "items"} imported.`,
            singleRes: payload,
        };
    } catch (error: unknown) {
        return { success: false, msg: safeErrorMessage({ error }) };
    }
};
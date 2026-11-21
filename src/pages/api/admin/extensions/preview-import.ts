import grabSuperAdminUser from "@/src/functions/backend/backups/grab-super-admin-user";
import previewExtensionImport from "@/src/functions/backend/db/extension-bundles/preview-extension-import";
import { PreviewExtensionImportRequestSchema } from "@/src/schemas/extension-bundle-schema";
import type { ExtensionImportPreview } from "@/src/types";
import AppError from "@/src/utils/app-error";
import parseWithSchema from "@/src/utils/parse-with-schema";
import safeErrorMessage from "@/src/utils/safe-error-message";
import type { APIResponseObject, BunextAPIRouteHandler, BunextServerRouteConfig } from "@moduletrace/bunext/types";

export const config: BunextServerRouteConfig = {
    max_request_body_mb: 200,
};

/**
 * Super admin only: what importing a bundle's items of one kind would do,
 * item by item. Reads only.
 */
export const handler: BunextAPIRouteHandler<APIResponseObject<ExtensionImportPreview>> = async ({ req, body }) => {
    try {
        if (req.method != "POST") {
            throw new AppError(`Method not allowed`);
        }

        const user = await grabSuperAdminUser({ req });

        if (!user?.id) {
            throw new AppError(`Only a super admin can do that.`);
        }

        const data = parseWithSchema({ schema: PreviewExtensionImportRequestSchema, data: body });
        const preview = await previewExtensionImport({ bundle: data.bundle, kind: data.kind });

        return {
            success: preview.items.length > 0,
            msg: preview.items.length
                ? ""
                : preview.other_kinds
                  ? `This file holds none of these; its ${preview.other_kinds} items belong to other pages.`
                  : `This file holds nothing to import.`,
            singleRes: preview,
        };
    } catch (error: unknown) {
        return { success: false, msg: safeErrorMessage({ error }) };
    }
};
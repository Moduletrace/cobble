import grabSuperAdminUser from "@/src/functions/backend/backups/grab-super-admin-user";
import grabInstallName from "@/src/functions/backend/db/app-settings/grab-install-name";
import saveAppSetting from "@/src/functions/backend/db/app-settings/save-app-setting";
import logEvent, { grabRequestIP } from "@/src/functions/backend/logger";
import { PwaInstallNameSettingKey } from "@/src/data/pwa-data";
import { SaveInstallNameRequestSchema } from "@/src/schemas/install-schema";
import AppError from "@/src/utils/app-error";
import parseWithSchema from "@/src/utils/parse-with-schema";
import safeErrorMessage from "@/src/utils/safe-error-message";
import type { APIResponseObject, BunextAPIRouteHandler } from "@moduletrace/bunext/types";

/**
 * Super admin only: the name this install goes by when it's installed as
 * an app. Empty puts `SiteName` back.
 */
export const handler: BunextAPIRouteHandler<APIResponseObject<{ install_name: string }>> = async ({
    req,
    body,
}) => {
    try {
        if (req.method != "POST") throw new AppError(`Method not allowed`);

        const user = await grabSuperAdminUser({ req });

        if (!user?.id) throw new AppError(`Only a super admin can rename the install.`);

        const { install_name } = parseWithSchema({
            schema: SaveInstallNameRequestSchema,
            data: body,
        });

        await saveAppSetting({ key: PwaInstallNameSettingKey, value: install_name || null });

        await logEvent({
            title: "Install renamed",
            category: "system",
            user_id: user.id,
            plain_text: `User #${user.id} set the install name to ${install_name ? `"${install_name}"` : "the default"}.`,
            metadata: { install_name },
            ip_address: grabRequestIP(req),
        });

        return { success: true, singleRes: { install_name: await grabInstallName() } };
    } catch (error: unknown) {
        return { success: false, msg: safeErrorMessage({ error }) };
    }
};

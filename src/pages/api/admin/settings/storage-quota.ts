import grabSuperAdminUser from "@/src/functions/backend/backups/grab-super-admin-user";
import grabStorageQuotaOverview, {
    type StorageQuotaOverview,
} from "@/src/functions/backend/db/app-settings/grab-storage-quota-overview";
import saveAppSetting from "@/src/functions/backend/db/app-settings/save-app-setting";
import logEvent, { grabRequestIP } from "@/src/functions/backend/logger";
import { BotFileQuotaSettingKey } from "@/src/dict/bot-file-dict";
import { SaveStorageQuotaRequestSchema } from "@/src/schemas/bot-file-schema";
import AppError from "@/src/utils/app-error";
import parseWithSchema from "@/src/utils/parse-with-schema";
import safeErrorMessage from "@/src/utils/safe-error-message";
import type { APIResponseObject, BunextAPIRouteHandler } from "@moduletrace/bunext/types";

/**
 * Super admin only: the per-folder quota for what bots save, in MB. Zero
 * puts the code's default back.
 */
export const handler: BunextAPIRouteHandler<APIResponseObject<StorageQuotaOverview>> = async ({
    req,
    body,
}) => {
    try {
        if (req.method != "POST") throw new AppError(`Method not allowed`);

        const user = await grabSuperAdminUser({ req });

        if (!user?.id) throw new AppError(`Only a super admin can change the storage quota.`);

        const { quota_mb } = parseWithSchema({
            schema: SaveStorageQuotaRequestSchema,
            data: body,
        });

        await saveAppSetting({
            key: BotFileQuotaSettingKey,
            value: quota_mb > 0 ? String(quota_mb) : null,
        });

        await logEvent({
            title: "Bot file quota changed",
            category: "system",
            user_id: user.id,
            plain_text: `User #${user.id} set the bot file quota to ${quota_mb} MB per folder.`,
            metadata: { quota_mb },
            ip_address: grabRequestIP(req),
        });

        return { success: true, singleRes: await grabStorageQuotaOverview() };
    } catch (error: unknown) {
        return { success: false, msg: safeErrorMessage({ error }) };
    }
};

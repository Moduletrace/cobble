import grabSuperAdminUser from "@/src/functions/backend/backups/grab-super-admin-user";
import grabLogRetentionOverview from "@/src/functions/backend/db/app-settings/grab-logs-keep-days";
import saveAppSetting from "@/src/functions/backend/db/app-settings/save-app-setting";
import logEvent, { grabRequestIP } from "@/src/functions/backend/logger";
import { LogsKeepDaysSettingKey } from "@/src/dict/log-categories";
import { SaveLogRetentionRequestSchema } from "@/src/schemas/log-schema";
import type { LogRetentionOverview } from "@/src/types";
import AppError from "@/src/utils/app-error";
import parseWithSchema from "@/src/utils/parse-with-schema";
import safeErrorMessage from "@/src/utils/safe-error-message";
import type { APIResponseObject, BunextAPIRouteHandler } from "@moduletrace/bunext/types";

/**
 * Super admin only: how many days logs are kept before the daily prune
 * deletes them. Zero puts the code's default back.
 */
export const handler: BunextAPIRouteHandler<APIResponseObject<LogRetentionOverview>> = async ({ req, body }) => {
    try {
        if (req.method != "POST") throw new AppError(`Method not allowed`);

        const user = await grabSuperAdminUser({ req });

        if (!user?.id) throw new AppError(`Only a super admin can change how long logs are kept.`);

        const { keep_days } = parseWithSchema({ schema: SaveLogRetentionRequestSchema, data: body });

        await saveAppSetting({
            key: LogsKeepDaysSettingKey,
            value: keep_days > 0 ? String(keep_days) : null,
        });

        await logEvent({
            title: "Log retention changed",
            category: "system",
            user_id: user.id,
            plain_text: `User #${user.id} set logs to be kept for ${keep_days || "the default number of"} days.`,
            metadata: { keep_days },
            ip_address: grabRequestIP(req),
        });

        return { success: true, singleRes: await grabLogRetentionOverview() };
    } catch (error: unknown) {
        return { success: false, msg: safeErrorMessage({ error }) };
    }
};

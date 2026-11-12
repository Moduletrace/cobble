import grabSuperAdminUser from "@/src/functions/backend/backups/grab-super-admin-user";
import grabComputerWorkspaceQuotaOverview, {
    type ComputerWorkspaceQuotaOverview,
} from "@/src/functions/backend/db/app-settings/grab-computer-workspace-quota-overview";
import saveAppSetting from "@/src/functions/backend/db/app-settings/save-app-setting";
import logEvent, { grabRequestIP } from "@/src/functions/backend/logger";
import { ComputerWorkspaceQuotaSettingKey } from "@/src/dict/computer-dict";
import { SaveComputerWorkspaceQuotaRequestSchema } from "@/src/schemas/computer-workspace-quota-schema";
import AppError from "@/src/utils/app-error";
import parseWithSchema from "@/src/utils/parse-with-schema";
import safeErrorMessage from "@/src/utils/safe-error-message";
import type { APIResponseObject, BunextAPIRouteHandler } from "@moduletrace/bunext/types";

/**
 * Super admin only: the most a computer's workspace may hold, in MB. Only
 * the limit is stored, so every computer picks a new one up on its next
 * write without being recreated. Zero sets no limit.
 */
export const handler: BunextAPIRouteHandler<APIResponseObject<ComputerWorkspaceQuotaOverview>> = async ({
    req,
    body,
}) => {
    try {
        if (req.method != "POST") throw new AppError(`Method not allowed`);

        const user = await grabSuperAdminUser({ req });

        if (!user?.id) throw new AppError(`Only a super admin can change the computer workspace limit.`);

        const { quota_mb } = parseWithSchema({
            schema: SaveComputerWorkspaceQuotaRequestSchema,
            data: body,
        });

        await saveAppSetting({
            key: ComputerWorkspaceQuotaSettingKey,
            value: String(quota_mb > 0 ? quota_mb : 0),
        });

        await logEvent({
            title: "Computer workspace limit changed",
            category: "system",
            user_id: user.id,
            plain_text: `User #${user.id} set the computer workspace limit to ${quota_mb} MB.`,
            metadata: { quota_mb },
            ip_address: grabRequestIP(req),
        });

        return { success: true, singleRes: await grabComputerWorkspaceQuotaOverview() };
    } catch (error: unknown) {
        return { success: false, msg: safeErrorMessage({ error }) };
    }
};
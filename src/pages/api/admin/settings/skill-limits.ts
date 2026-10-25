import grabSuperAdminUser from "@/src/functions/backend/backups/grab-super-admin-user";
import grabSkillLimitsOverview, {
    type SkillLimitsOverview,
} from "@/src/functions/backend/db/app-settings/grab-skill-limits";
import saveAppSetting from "@/src/functions/backend/db/app-settings/save-app-setting";
import logEvent, { grabRequestIP } from "@/src/functions/backend/logger";
import { SkillBodyMaxCharsSettingKey, SkillBodyShownCharsSettingKey } from "@/src/dict/skill-dict";
import { SaveSkillLimitsRequestSchema } from "@/src/schemas/extension-schema";
import AppError from "@/src/utils/app-error";
import parseWithSchema from "@/src/utils/parse-with-schema";
import safeErrorMessage from "@/src/utils/safe-error-message";
import type { APIResponseObject, BunextAPIRouteHandler } from "@moduletrace/bunext/types";

/**
 * Super admin only: the longest runbook a skill may save, and how much of
 * it `load_skill` hands back at once. Zero puts the code's default back for
 * that one.
 */
export const handler: BunextAPIRouteHandler<APIResponseObject<SkillLimitsOverview>> = async ({
    req,
    body,
}) => {
    try {
        if (req.method != "POST") throw new AppError(`Method not allowed`);

        const user = await grabSuperAdminUser({ req });

        if (!user?.id) throw new AppError(`Only a super admin can change the skill limits.`);

        const { body_max_chars, body_shown_chars } = parseWithSchema({
            schema: SaveSkillLimitsRequestSchema,
            data: body,
        });

        await saveAppSetting({
            key: SkillBodyMaxCharsSettingKey,
            value: body_max_chars > 0 ? String(body_max_chars) : null,
        });
        await saveAppSetting({
            key: SkillBodyShownCharsSettingKey,
            value: body_shown_chars > 0 ? String(body_shown_chars) : null,
        });

        await logEvent({
            title: "Skill limits changed",
            category: "system",
            user_id: user.id,
            plain_text: `User #${user.id} set the skill runbook limit to ${body_max_chars || "default"} characters, ${body_shown_chars || "default"} read at once.`,
            metadata: { body_max_chars, body_shown_chars },
            ip_address: grabRequestIP(req),
        });

        return { success: true, singleRes: await grabSkillLimitsOverview() };
    } catch (error: unknown) {
        return { success: false, msg: safeErrorMessage({ error }) };
    }
};

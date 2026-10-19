import grabSuperAdminUser from "@/src/functions/backend/backups/grab-super-admin-user";
import grabHarnessOverview from "@/src/functions/backend/db/harness/grab-harness-overview";
import grabHarnessSetting from "@/src/functions/backend/db/harness/grab-harness-setting";
import saveHarnessSetting from "@/src/functions/backend/db/harness/save-harness-setting";
import logEvent, { grabRequestIP } from "@/src/functions/backend/logger";
import { SaveHarnessSettingsRequestSchema } from "@/src/schemas/harness-schema";
import type { HarnessOverviewPayload } from "@/src/types";
import AppError from "@/src/utils/app-error";
import parseWithSchema from "@/src/utils/parse-with-schema";
import safeErrorMessage from "@/src/utils/safe-error-message";
import type {
    APIResponseObject,
    BunextAPIRouteHandler,
} from "@moduletrace/bunext/types";

/**
 * Super admin only: saves which model each harness uses.
 */
export const handler: BunextAPIRouteHandler<
    APIResponseObject<HarnessOverviewPayload>
> = async ({ req, body }) => {
    try {
        if (req.method != "POST") {
            throw new AppError(`Method not allowed`);
        }

        const user = await grabSuperAdminUser({ req });

        if (!user?.id) {
            throw new AppError(`Only a super admin can change model settings.`);
        }

        const { settings } = parseWithSchema({
            schema: SaveHarnessSettingsRequestSchema,
            data: body,
        });

        for (const setting of settings) {
            const existing = await grabHarnessSetting({ harness: setting.harness });
            const { voice, ...options } = existing.options;

            await saveHarnessSetting({
                harness: setting.harness,
                model_id: setting.model_id,
                provider_id: setting.provider_id,
                fallback: setting.fallback,
                enabled: setting.enabled,
                options: setting.voice ? { ...options, voice: setting.voice } : options,
            });
        }

        await logEvent({
            title: "Model settings changed",
            category: "system",
            user_id: user.id,
            plain_text: `User #${user.id} changed the model settings for ${settings.map((s) => s.harness).join(", ")}.`,
            metadata: { settings },
            ip_address: grabRequestIP(req),
        });

        return {
            success: true,
            msg: `Saved.`,
            singleRes: await grabHarnessOverview(),
        };
    } catch (error: unknown) {
        return {
            success: false,
            msg: safeErrorMessage({ error }),
        };
    }
};

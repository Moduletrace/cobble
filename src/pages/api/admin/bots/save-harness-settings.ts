import userAuth from "@/src/functions/backend/auth/user-auth";
import grabUserBot from "@/src/functions/backend/db/bots/grab-user-bot";
import grabBotHarnessOverview from "@/src/functions/backend/db/harness/grab-bot-harness-overview";
import grabHarnessSetting from "@/src/functions/backend/db/harness/grab-harness-setting";
import saveBotHarnessSetting from "@/src/functions/backend/db/harness/save-bot-harness-setting";
import logEvent, { grabRequestIP } from "@/src/functions/backend/logger";
import { SaveBotHarnessSettingsRequestSchema } from "@/src/schemas/harness-schema";
import type { BotHarnessOverviewPayload } from "@/src/types";
import AppError from "@/src/utils/app-error";
import parseWithSchema from "@/src/utils/parse-with-schema";
import isReadOnlyUser from "@/src/utils/rbac/is-read-only-user";
import canManageCrew from "@/src/utils/rbac/can-manage-crew";
import safeErrorMessage from "@/src/utils/safe-error-message";
import type {
    APIResponseObject,
    BunextAPIRouteHandler,
} from "@moduletrace/bunext/types";

/**
 * Saves which model each harness uses for one of the session user's
 * worker bots. The coordinator always uses the defaults.
 */
export const handler: BunextAPIRouteHandler<
    APIResponseObject<BotHarnessOverviewPayload>
> = async ({ req, body }) => {
    try {
        if (req.method != "POST") {
            throw new AppError(`Method not allowed`);
        }

        const { user, user_types } = await userAuth({ req });

        if (!user?.logged_in_status || !user.id) {
            return { success: false, msg: `Unauthorized`, logoutUser: true };
        }

        if (isReadOnlyUser({ user_types: user_types || [] })) {
            throw new AppError(`This user can only read records.`);
        }

        if (!canManageCrew({ user_types })) {
            throw new AppError(`Only an admin can do that.`);
        }

        const { bot_id, settings } = parseWithSchema({
            schema: SaveBotHarnessSettingsRequestSchema,
            data: body,
        });

        const bot = await grabUserBot({ bot_id, user_id: user.id });

        if (!bot?.id) {
            throw new AppError(`Bot not found.`);
        }

        if (bot.kind == "coordinator") {
            throw new AppError(
                `The coordinator uses the default models. A super admin can change them in Settings, under Models.`,
            );
        }

        for (const setting of settings) {
            const existing = await grabHarnessSetting({ harness: setting.harness, bot_id: bot.id });
            const { voice, ...options } = existing.source == "bot" ? existing.options : {};

            await saveBotHarnessSetting({
                bot_id: bot.id,
                harness: setting.harness,
                inherit: setting.inherit,
                model_id: setting.model_id,
                provider_id: setting.provider_id,
                fallback: setting.fallback,
                enabled: setting.enabled,
                options: setting.voice ? { ...options, voice: setting.voice } : options,
            });
        }

        await logEvent({
            title: "Bot model settings changed",
            category: "system",
            user_id: user.id,
            plain_text: `User #${user.id} changed ${bot.name}'s model settings for ${settings.map((s) => s.harness).join(", ")}.`,
            metadata: { bot_id: bot.id, settings },
            ip_address: grabRequestIP(req),
        });

        return {
            success: true,
            msg: `Saved.`,
            singleRes: await grabBotHarnessOverview({ bot_id: bot.id }),
        };
    } catch (error: unknown) {
        return {
            success: false,
            msg: safeErrorMessage({ error }),
        };
    }
};

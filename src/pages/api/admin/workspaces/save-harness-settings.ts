import userAuth from "@/src/functions/backend/auth/user-auth";
import grabBotHarnessOverview from "@/src/functions/backend/db/harness/grab-bot-harness-overview";
import grabHarnessSetting from "@/src/functions/backend/db/harness/grab-harness-setting";
import saveWorkspaceHarnessSetting from "@/src/functions/backend/db/harness/save-workspace-harness-setting";
import grabUserWorkspace from "@/src/functions/backend/db/workspaces/grab-user-workspace";
import logEvent, { grabRequestIP } from "@/src/functions/backend/logger";
import { SaveWorkspaceHarnessSettingsRequestSchema } from "@/src/schemas/harness-schema";
import type { BotHarnessOverviewPayload } from "@/src/types";
import AppError from "@/src/utils/app-error";
import parseWithSchema from "@/src/utils/parse-with-schema";
import isReadOnlyUser from "@/src/utils/rbac/is-read-only-user";
import safeErrorMessage from "@/src/utils/safe-error-message";
import type {
    APIResponseObject,
    BunextAPIRouteHandler,
} from "@moduletrace/bunext/types";

/**
 * Saves which model each harness uses in one of the session user's
 * workspaces. A workspace's models win over its bots' own, for the
 * coordinator too.
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

        const { workspace_id, settings } = parseWithSchema({
            schema: SaveWorkspaceHarnessSettingsRequestSchema,
            data: body,
        });

        const workspace = await grabUserWorkspace({ workspace_id, user_id: user.id });

        if (!workspace?.id) {
            throw new AppError(`Workspace not found.`);
        }

        for (const setting of settings) {
            const existing = await grabHarnessSetting({
                harness: setting.harness,
                workspace_id: workspace.id,
            });
            const { voice, ...options } = existing.source == "workspace" ? existing.options : {};

            await saveWorkspaceHarnessSetting({
                workspace_id: Number(workspace.id),
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
            title: "Workspace model settings changed",
            category: "system",
            user_id: user.id,
            plain_text: `User #${user.id} changed ${workspace.name}'s model settings for ${settings.map((s) => s.harness).join(", ")}.`,
            metadata: { workspace_id: workspace.id, settings },
            ip_address: grabRequestIP(req),
        });

        return {
            success: true,
            msg: `Saved.`,
            singleRes: await grabBotHarnessOverview({ workspace_id: Number(workspace.id) }),
        };
    } catch (error: unknown) {
        return {
            success: false,
            msg: safeErrorMessage({ error }),
        };
    }
};

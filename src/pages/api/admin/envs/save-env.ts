import grabSuperAdminUser from "@/src/functions/backend/backups/grab-super-admin-user";
import grabEnvsOverview from "@/src/functions/backend/db/envs/grab-envs-overview";
import grabScopedEnvs from "@/src/functions/backend/db/envs/grab-scoped-envs";
import saveEnv from "@/src/functions/backend/db/envs/save-env";
import logEvent, { grabRequestIP } from "@/src/functions/backend/logger";
import { SaveEnvRequestSchema, type SaveEnvRequest } from "@/src/schemas/env-schema";
import type { EnvsMutationResult } from "@/src/types";
import AppError from "@/src/utils/app-error";
import parseWithSchema from "@/src/utils/parse-with-schema";
import safeErrorMessage from "@/src/utils/safe-error-message";
import type {
    APIResponseObject,
    BunextAPIRouteHandler,
} from "@moduletrace/bunext/types";

/**
 * Super admin only: adds or edits an env. Logged by key, never by value.
 *
 * Answers with the fresh page data: the Environment overview or, from a
 * bot's or workspace's settings page (`scoped`), just that scope's envs.
 */
export const handler: BunextAPIRouteHandler<
    APIResponseObject<EnvsMutationResult>
> = async ({ req, body }) => {
    try {
        if (req.method != "POST") {
            throw new AppError(`Method not allowed`);
        }

        const user = await grabSuperAdminUser({ req });

        if (!user?.id) {
            throw new AppError(`Only a super admin can change the environment.`);
        }

        const env = parseWithSchema({ schema: SaveEnvRequestSchema, data: body });

        await saveEnv({ ...env, user_id: Number(user.id) });

        const scope_id =
            env.paradigm == "workspace"
                ? env.workspace_id
                : env.paradigm == "bot"
                  ? env.bot_id
                  : env.paradigm == "computer"
                    ? env.computer_id
                    : null;

        await logEvent({
            title: env.env_id ? "Env changed" : "Env added",
            category: "system",
            user_id: user.id,
            plain_text: `User #${user.id} ${env.env_id ? "changed" : "added"} ${env.key} (${env.paradigm}${scope_id ? ` #${scope_id}` : ""}).`,
            metadata: {
                key: env.key,
                paradigm: env.paradigm,
                workspace_id: env.workspace_id,
                computer_id: env.computer_id,
                bot_id: env.bot_id,
            },
            ip_address: grabRequestIP(req),
        });

        return {
            success: true,
            msg: `Saved ${env.key.trim()}.`,
            singleRes: await mutationResult({ env, scoped: env.scoped, user_id: Number(user.id) }),
        };
    } catch (error: unknown) {
        return { success: false, msg: safeErrorMessage({ error }) };
    }
};

/**
 * What the page is showing after the change.
 */
async function mutationResult({
    env,
    scoped,
    user_id,
}: {
    env: SaveEnvRequest;
    scoped?: boolean;
    user_id: number;
}): Promise<EnvsMutationResult> {
    if (scoped && (env.paradigm == "bot" || env.paradigm == "workspace")) {
        const owner_id = env.paradigm == "bot" ? env.bot_id : env.workspace_id;

        if (owner_id) {
            return {
                scoped: await grabScopedEnvs({
                    paradigm: env.paradigm,
                    owner_id,
                    user_id,
                    can_manage: true,
                }),
            };
        }
    }

    return { overview: await grabEnvsOverview({ user_id }) };
}

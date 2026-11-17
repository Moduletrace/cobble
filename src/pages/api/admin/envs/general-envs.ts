import grabSuperAdminUser from "@/src/functions/backend/backups/grab-super-admin-user";
import grabGeneralEnvKeys from "@/src/functions/backend/db/envs/grab-general-env-keys";
import saveEnv from "@/src/functions/backend/db/envs/save-env";
import logEvent, { grabRequestIP } from "@/src/functions/backend/logger";
import { SaveGeneralEnvRequestSchema } from "@/src/schemas/env-schema";
import type { EnvKeyOption } from "@/src/types";
import AppError from "@/src/utils/app-error";
import parseWithSchema from "@/src/utils/parse-with-schema";
import safeErrorMessage from "@/src/utils/safe-error-message";
import type { APIResponseObject, BunextAPIRouteHandler } from "@moduletrace/bunext/types";

/**
 * Super admin only: the general envs an MCP server's or browser's headers
 * can point at (GET), and adding one from that form (POST), always general,
 * secret and not set on computers. Answers with the fresh list, so the
 * form can pick what was just saved. Never values.
 */
export const handler: BunextAPIRouteHandler<APIResponseObject<EnvKeyOption[]>> = async ({ req, body }) => {
    try {
        if (req.method != "GET" && req.method != "POST") throw new AppError(`Method not allowed`);

        const user = await grabSuperAdminUser({ req });

        if (!user?.id) throw new AppError(`Only a super admin can set the environment.`);

        if (req.method == "GET") {
            return { success: true, singleRes: await grabGeneralEnvKeys() };
        }

        const request = parseWithSchema({ schema: SaveGeneralEnvRequestSchema, data: body });

        await saveEnv({
            user_id: Number(user.id),
            key: request.key,
            value: request.value,
            description: request.description,
            paradigm: "general",
            secret: true,
            expose_to_computers: false,
        });

        await logEvent({
            title: "Env added",
            category: "system",
            user_id: user.id,
            plain_text: `User #${user.id} added ${request.key.trim()} (general) from an MCP server's form.`,
            metadata: { key: request.key.trim(), paradigm: "general" },
            ip_address: grabRequestIP(req),
        });

        return {
            success: true,
            msg: `Saved ${request.key.trim()}.`,
            singleRes: await grabGeneralEnvKeys(),
        };
    } catch (error: unknown) {
        return { success: false, msg: safeErrorMessage({ error }) };
    }
};
import grabSuperAdminUser from "@/src/functions/backend/backups/grab-super-admin-user";
import saveInstallIcon from "@/src/functions/backend/install-icon/save-install-icon";
import logEvent, { grabRequestIP } from "@/src/functions/backend/logger";
import { AppData } from "@/src/data/app-data";
import type { PwaInstallIcon } from "@/src/data/pwa-data";
import type { BotHue } from "@/src/dict/bot-dict";
import { SaveInstallIconRequestSchema } from "@/src/schemas/install-schema";
import AppError from "@/src/utils/app-error";
import bufferFromBase64 from "@/src/utils/buffer-from-base-64";
import parseWithSchema from "@/src/utils/parse-with-schema";
import safeErrorMessage from "@/src/utils/safe-error-message";
import type { APIResponseObject, BunextAPIRouteHandler } from "@moduletrace/bunext/types";

/**
 * Super admin only: the icon this install goes by as an installed app, a
 * stone or an uploaded image with the stone in its corner.
 */
export const handler: BunextAPIRouteHandler<APIResponseObject<PwaInstallIcon>> = async ({
    req,
    body,
}) => {
    try {
        if (req.method != "POST") throw new AppError(`Method not allowed`);

        const user = await grabSuperAdminUser({ req });

        if (!user?.id) throw new AppError(`Only a super admin can change the app icon.`);

        const { mode, stone, mark, data_url } = parseWithSchema({
            schema: SaveInstallIconRequestSchema,
            data: body,
        });

        const image = data_url ? (await bufferFromBase64(data_url)).buffer : null;

        if (image && image.length > AppData.ProfileImageMaxBytes) {
            throw new AppError(
                `That image is too big. Images can be up to ${Math.round(AppData.ProfileImageMaxBytes / 1024 / 1024)} MB.`,
            );
        }

        const icon = await saveInstallIcon({ mode, stone: stone as BotHue, mark, image });

        await logEvent({
            title: "App icon changed",
            category: "system",
            user_id: user.id,
            plain_text: `User #${user.id} set the app icon to ${mode == "image" ? `an image${mark ? ` with the ${stone} mark` : ""}` : `the ${stone} stone`}.`,
            metadata: { mode, stone, mark, version: icon.version, new_image: Boolean(image) },
            ip_address: grabRequestIP(req),
        });

        return { success: true, singleRes: icon };
    } catch (error: unknown) {
        return { success: false, msg: safeErrorMessage({ error }) };
    }
};

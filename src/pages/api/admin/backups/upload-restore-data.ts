import grabSuperAdminUser from "@/src/functions/backend/backups/grab-super-admin-user";
import restoreDataBackup from "@/src/functions/backend/backups/restore-data-backup";
import restartApp from "@/src/functions/backend/backups/restart-app";
import saveUploadedDataBackup from "@/src/functions/backend/backups/save-uploaded-data-backup";
import logEvent, { grabRequestIP, logError } from "@/src/functions/backend/logger";
import type {
    APIResponseObject,
    BunextAPIRouteHandler,
    BunextServerRouteConfig,
} from "@moduletrace/bunext/types";

export const config: BunextServerRouteConfig = {
    max_request_body_mb: 500,
};

/**
 * Multipart upload (`file` field) of a whole-data archive. The file is
 * saved into the archive directory, then restored, and the app restarts.
 */
export const handler: BunextAPIRouteHandler<APIResponseObject> = async ({
    req,
}) => {
    const user = await grabSuperAdminUser({ req });

    if (!user?.id) {
        return {
            success: false,
            msg: `Unauthorized`,
        };
    }

    let file_name: string | undefined;
    let backup_name: string | undefined;

    try {
        const file = (await req.formData()).get("file");

        if (!(file instanceof File)) {
            throw new Error(`No archive uploaded`);
        }

        file_name = file.name;
        backup_name = await saveUploadedDataBackup({ file });

        const result = await restoreDataBackup({ backup_name });

        await logEvent({
            title: "Data restored from upload",
            category: "system",
            user_id: user.id,
            plain_text: `User #${user.id} restored the data volume from uploaded archive ${file_name} (saved as ${result.restored_name}, safety copy ${result.safety_name}). The app restarted.`,
            metadata: {
                file_name,
                backup_name: result.restored_name,
                safety_name: result.safety_name,
            },
            ip_address: grabRequestIP(req),
        });

        restartApp();

        return {
            success: true,
        };
    } catch (error: any) {
        await logError({
            title: "Data restore from upload failed",
            error,
            user_id: user.id,
            metadata: {
                file_name,
                backup_name,
            },
            ip_address: grabRequestIP(req),
        });

        return {
            success: false,
            msg: error.message,
        };
    }
};

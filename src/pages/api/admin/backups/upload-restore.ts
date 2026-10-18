import grabSuperAdminUser from "@/src/functions/backend/backups/grab-super-admin-user";
import saveUploadedDbBackup from "@/src/functions/backend/backups/save-uploaded-db-backup";
import restoreDbBackup from "@/src/functions/backend/backups/restore-db-backup";
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
 * Multipart upload (`file` field) of a SQLite database file. The file is
 * saved into the backups directory, then restored.
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
            throw new Error(`No backup file uploaded`);
        }

        file_name = file.name;
        backup_name = await saveUploadedDbBackup({ file });

        await restoreDbBackup({ backup_name });

        await logEvent({
            title: "Database restored from upload",
            category: "system",
            user_id: user.id,
            plain_text: `User #${user.id} restored the database from uploaded file ${file_name} (saved as ${backup_name}).`,
            metadata: {
                file_name,
                backup_name,
            },
            ip_address: grabRequestIP(req),
        });

        return {
            success: true,
        };
    } catch (error: any) {
        await logError({
            title: "Database restore from upload failed",
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

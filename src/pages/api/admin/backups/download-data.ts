import grabSuperAdminUser from "@/src/functions/backend/backups/grab-super-admin-user";
import resolveDataBackupPath from "@/src/functions/backend/backups/resolve-data-backup-path";
import type { ApiReqParams } from "@/src/types";
import type {
    APIResponseObject,
    BunextAPIRouteHandler,
} from "@moduletrace/bunext/types";
import path from "path";

/**
 * Streams a whole-data archive back, by name.
 */
export const handler: BunextAPIRouteHandler<APIResponseObject> = async ({
    req,
    query,
}) => {
    const user = await grabSuperAdminUser({ req });

    if (!user?.id) {
        return {
            success: false,
            msg: `Unauthorized`,
        };
    }

    try {
        const backup_path = resolveDataBackupPath({
            backup_name: (query as ApiReqParams | undefined)?.backup_name,
        });

        return new Response(Bun.file(backup_path), {
            headers: {
                "Content-Type": "application/gzip",
                "Content-Disposition": `attachment; filename="${path.basename(backup_path)}"`,
            },
        });
    } catch (error: any) {
        return {
            success: false,
            msg: error.message,
        };
    }
};

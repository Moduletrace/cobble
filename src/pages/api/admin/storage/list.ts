import userAuth from "@/src/functions/backend/auth/user-auth";
import listStorageEntries, { storageBreadcrumbs } from "@/src/functions/backend/storage/list-storage-entries";
import resolveStoragePath from "@/src/functions/backend/storage/resolve-storage-path";
import resolveStorageSpec from "@/src/functions/backend/storage/resolve-storage-spec";
import type { StorageFolderPayload } from "@/src/types";
import parseWithSchema from "@/src/utils/parse-with-schema";
import safeErrorMessage from "@/src/utils/safe-error-message";
import { StorageListRequestSchema } from "@/src/schemas/storage-schema";
import { parseStorageSpec } from "@/src/utils/storage-volumes";
import type { APIResponseObject, BunextAPIRouteHandler } from "@moduletrace/bunext/types";

/**
 * One folder on the data volume, for the files browser: its entries, the
 * breadcrumb trail and the folder's name. Only a folder the user reaches
 * (`resolveStorageSpec`) and only a path inside it
 * (`resolveStoragePath`), so a request never turns into a read.
 */
export const handler: BunextAPIRouteHandler<APIResponseObject<StorageFolderPayload>> = async ({
    req,
    query,
}) => {
    try {
        if (req.method != "GET") {
            return { success: false, msg: `Method not allowed` };
        }

        const { user } = await userAuth({ req });

        if (!user?.logged_in_status || !user.id) {
            return { success: false, msg: `Unauthorized`, logoutUser: true };
        }

        const { volume, owner, path, search, offset } = parseWithSchema({
            schema: StorageListRequestSchema,
            data: query,
        });
        const spec = parseStorageSpec({ volume, owner_id: owner });

        if (!spec) return { success: false, msg: `Not found.` };

        const resolved = await resolveStorageSpec({ user_id: user.id, spec });

        if (!resolved) return { success: false, msg: `Not found.` };

        const target = resolveStoragePath({ root: resolved.root, path });
        const listing = await listStorageEntries({
            resolved,
            absolute: target.absolute,
            relative: target.relative,
            search,
            offset,
        });

        return {
            success: true,
            singleRes: {
                spec: resolved.spec,
                label: resolved.label,
                path: target.relative,
                breadcrumbs: storageBreadcrumbs({ spec: resolved.spec, path: target.relative }),
                entries: listing.entries,
                total: listing.total,
                offset: listing.offset,
            },
        };
    } catch (error: unknown) {
        return { success: false, msg: safeErrorMessage({ error }) };
    }
};

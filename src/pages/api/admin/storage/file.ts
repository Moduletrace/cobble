import { statSync } from "node:fs";
import userAuth from "@/src/functions/backend/auth/user-auth";
import grabStorageFile from "@/src/functions/backend/storage/grab-storage-file";
import resolveStorageSpec from "@/src/functions/backend/storage/resolve-storage-spec";
import parseWithSchema from "@/src/utils/parse-with-schema";
import safeErrorMessage from "@/src/utils/safe-error-message";
import { StorageFileRequestSchema } from "@/src/schemas/storage-schema";
import { parseStorageSpec } from "@/src/utils/storage-volumes";
import type { APIResponseObject, BunextAPIRouteHandler } from "@moduletrace/bunext/types";

/**
 * `GET ?volume=..&owner=..&path=..`: one file on the data volume, streamed
 * as it is. Access is checked twice, once for the folder
 * (`resolveStorageSpec`) and once for the file's own path
 * (`grabStorageFile`), so a folder the user reaches never becomes a way to
 * read the rest of the disk.
 */
export const handler: BunextAPIRouteHandler<APIResponseObject> = async ({ req, query }) => {
    try {
        if (req.method != "GET") {
            return { success: false, msg: `Method not allowed` };
        }

        const { user } = await userAuth({ req });

        if (!user?.logged_in_status || !user.id) {
            return { success: false, msg: `Unauthorized`, logoutUser: true };
        }

        const { volume, owner, path } = parseWithSchema({
            schema: StorageFileRequestSchema,
            data: query,
        });
        const spec = parseStorageSpec({ volume, owner_id: owner });

        if (!spec) return { success: false, msg: `Not found.` };

        const resolved = await resolveStorageSpec({ user_id: user.id, spec });

        if (!resolved) return { success: false, msg: `Not found.` };

        const file = grabStorageFile({ resolved, path });

        if (!file) return { success: false, msg: `Not found.` };

        const etag = `"${file.size}-${Math.round(statSync(file.absolute).mtimeMs)}"`;
        const headers = new Headers({
            "Content-Type": file.mime_type,
            "Content-Disposition": `inline; filename*=UTF-8''${encodeURIComponent(file.name)}`,
            "X-Content-Type-Options": "nosniff",
            ETag: etag,
            "Cache-Control": "private, no-cache",
        });

        if (req.headers.get("if-none-match") === etag) {
            return new Response(null, { status: 304, headers });
        }

        return new Response(Bun.file(file.absolute), { headers });
    } catch (error: unknown) {
        return { success: false, msg: safeErrorMessage({ error }) };
    }
};

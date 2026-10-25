import type { AdminCrudAPIParams } from "@/src/types";
import type { APIResponseObject } from "@moduletrace/bunext/types";

/**
 * Media rows are never written straight through the CRUD API: a row
 * names a file on disk, and only the upload routes (`upload-media`,
 * `bots/upload-attachment`) write both the file and the row that points
 * at it.
 */
export default async function (_params: AdminCrudAPIParams): Promise<APIResponseObject> {
    return {
        success: false,
        msg: `Upload files through the upload routes.`,
    };
}

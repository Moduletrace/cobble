import userAuth from "@/src/functions/backend/auth/user-auth";
import listStorageEntries, { storageBreadcrumbs } from "@/src/functions/backend/storage/list-storage-entries";
import resolveStoragePath from "@/src/functions/backend/storage/resolve-storage-path";
import resolveStorageSpec, { grabStorageSpecs } from "@/src/functions/backend/storage/resolve-storage-spec";
import type { PagePropsType, StorageFolderPayload } from "@/src/types";
import { parseStorageSpec, type StorageSpec } from "@/src/utils/storage-volumes";
import type { BunextPageServerFn } from "@moduletrace/bunext/types";

/**
 * Files: one folder on the app's data volume. The folders the user may
 * open come with the page, and so does the folder asked for (or the first
 * one); moving to another folder loads through the API, so a page stays
 * small.
 */
export const server: BunextPageServerFn<PagePropsType> = async (params) => {
    const query = params.query || {};
    const { user } = await userAuth({ req: params.req });

    if (!user?.id) {
        return { redirect: { destination: "/auth/login" } };
    }

    const folders = await grabStorageSpecs({ user_id: user.id });
    const asked = parseStorageSpec({
        volume: query.volume,
        owner_id: query.owner,
    });
    const known =
        asked &&
        folders.some(
            (folder) =>
                folder.spec.volume == asked.volume && folder.spec.owner_id == asked.owner_id,
        );
    const spec = known ? asked : folders[0]?.spec;

    if (!spec) {
        return { props: { storage_folders: [], storage_folder: null } };
    }

    const storage_folder = await folderPayload({
        user_id: Number(user.id),
        spec,
        path: query.path || "",
    });

    return { props: { storage_folders: folders, storage_folder } };
};

/**
 * One folder's payload, or null when the user doesn't reach it (or its
 * path escapes the volume).
 */
async function folderPayload({
    user_id,
    spec,
    path,
}: {
    user_id: number;
    spec: StorageSpec;
    path?: string;
}): Promise<StorageFolderPayload | null> {
    const resolved = await resolveStorageSpec({ user_id, spec }).catch(() => null);

    if (!resolved) return null;

    const target = resolveStoragePath({ root: resolved.root, path });
    const listing = await listStorageEntries({
        resolved,
        absolute: target.absolute,
        relative: target.relative,
    }).catch(() => null);

    if (!listing) return null;

    return {
        spec: resolved.spec,
        label: resolved.label,
        path: target.relative,
        breadcrumbs: storageBreadcrumbs({ spec: resolved.spec, path: target.relative }),
        entries: listing.entries,
        total: listing.total,
        offset: listing.offset,
    };
}

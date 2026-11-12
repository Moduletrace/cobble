import pruneOrphanMedia from "@/src/functions/backend/db/media/prune-orphan-media";

/**
 * Deletes media nothing points at any more (`pruneOrphanMedia`): chat
 * uploads left behind by a pruned room or hook session, and uploads that
 * were never saved. It is how their bytes leave the data volume.
 */
export default async function cronPruneOrphanMedia() {
    return { deleted: (await pruneOrphanMedia()).length };
}
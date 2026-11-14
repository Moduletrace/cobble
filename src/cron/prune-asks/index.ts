import pruneAsks from "@/src/functions/backend/db/asks/prune-asks";

/**
 * Deletes ended crew requests past the install's retention, and the oldest
 * ones past the number a place keeps. A request still pending or working,
 * or one an open request was asked from, is kept.
 */
export default async function pruneAsksJob() {
    return await pruneAsks();
}

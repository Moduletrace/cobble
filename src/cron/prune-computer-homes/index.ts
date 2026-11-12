import pruneComputerHomes from "@/src/functions/backend/db/computers/prune-computer-homes";

/**
 * Deletes the computer folders `prepareComputerDataDir` moved aside
 * (`pruneComputerHomes`) once their data is past its keep. They are no
 * longer mounted anywhere, so they only take space on the data volume.
 */
export default async function cronPruneComputerHomes() {
    return { deleted: (await pruneComputerHomes()).length };
}

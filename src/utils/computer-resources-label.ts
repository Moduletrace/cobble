import { AppData } from "@/src/data/app-data";
import type { BUN_SQLITE_COBBLE_COMPUTERS } from "@/db/types/db";

type Params = {
    computer: Pick<BUN_SQLITE_COBBLE_COMPUTERS, "cpus" | "memory_mb">;
};

/**
 * A computer's resources in a few words, e.g. "1 CPU · 2 GB". One saved
 * without them gets the defaults when it's next set up.
 */
export default function computerResourcesLabel({ computer }: Params) {
    const cpus = Number(computer.cpus) || AppData.ComputerDefaultCpus;
    const gb = (Number(computer.memory_mb) || AppData.ComputerDefaultMemoryMb) / 1024;

    return `${cpus} CPU${cpus == 1 ? "" : "s"} · ${Number(gb.toFixed(2))} GB`;
}

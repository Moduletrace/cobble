import { AppData } from "@/src/data/app-data";

type Params = {
    status?: string | null;
    /**
     * The container's `updated_at`, touched while a setup runs
     * (`keepComputerSetupAlive`).
     */
    updated_at?: number | string | null;
    now?: number;
};

/**
 * Whether a computer left `creating` by a process that's gone: nothing has
 * touched it for `AppData.ComputerSetupStaleMs`, so no setup is running
 * and none will finish it.
 */
export default function computerSetupInterrupted({ status, updated_at, now = Date.now() }: Params) {
    if (status != "creating") return false;

    return now - (Number(updated_at) || 0) > AppData.ComputerSetupStaleMs;
}

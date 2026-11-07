import { AppData } from "@/src/data/app-data";
import { grabModelRestSeconds } from "@/src/functions/backend/db/app-settings/grab-run-limits";

/**
 * How long a failed model rests, in ms (`grabModelRestSeconds`). Falls
 * back to `AppData.HarnessModelRestMs` when the setting can't be read, so
 * a harness call never fails over it.
 */
export default async function grabModelRestMs() {
    try {
        return (await grabModelRestSeconds()) * 1000;
    } catch {
        return AppData.HarnessModelRestMs;
    }
}

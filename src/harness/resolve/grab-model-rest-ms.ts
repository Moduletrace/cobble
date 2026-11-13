import { AppData } from "@/src/data/app-data";
import { grabModelRestSeconds } from "@/src/functions/backend/db/app-settings/grab-run-limits";
import { isUnlimitedLimit } from "@/src/utils/run-limit";

/**
 * How long a failed model rests, in ms (`grabModelRestSeconds`).
 * Unlimited means a failed model isn't tried again until the setting
 * changes or the app restarts: the cooldown never runs out. Falls back to
 * `AppData.HarnessModelRestMs` when the setting can't be read, so a
 * harness call never fails over it.
 */
export default async function grabModelRestMs() {
    try {
        const seconds = await grabModelRestSeconds();

        return isUnlimitedLimit(seconds) ? Infinity : seconds * 1000;
    } catch {
        return AppData.HarnessModelRestMs;
    }
}

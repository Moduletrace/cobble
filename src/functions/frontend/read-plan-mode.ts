import { AppData } from "@/src/data/app-data";
import planModeKey from "@/src/utils/plan-mode-key";

type Params = {
    bot_id?: number | string | null;
    workspace_id?: number | string | null;
};

type Modes = Record<string, boolean>;

/**
 * The conversations left with Plan mode on, as stored. A value written by
 * an older version (or anything else in its place) reads as none, so the
 * next save replaces it rather than failing.
 */
function readModes(): Modes {
    try {
        const stored = JSON.parse(localStorage.getItem(AppData["PlanModeStorageKey"]) || "{}");

        return stored && typeof stored == "object" && !Array.isArray(stored) ? stored : {};
    } catch {
        return {};
    }
}

/**
 * Whether Plan mode was left on for this conversation on this device
 * (`rememberPlanMode`). Off until the user turns it on.
 */
export default function readPlanMode({ bot_id, workspace_id }: Params): boolean {
    return Boolean(readModes()[planModeKey({ bot_id, workspace_id })]);
}
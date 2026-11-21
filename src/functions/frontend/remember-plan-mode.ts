import { AppData } from "@/src/data/app-data";
import planModeKey from "@/src/utils/plan-mode-key";

type Params = {
    bot_id?: number | string | null;
    workspace_id?: number | string | null;
    on: boolean;
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
 * Records Plan mode for this conversation on this device, so coming back to
 * it starts where the user left it (`readPlanMode`). Best effort: a browser
 * that refuses storage only loses the memory.
 */
export default function rememberPlanMode({ bot_id, workspace_id, on }: Params) {
    try {
        const key = AppData["PlanModeStorageKey"];
        const modes = readModes();
        const conversation = planModeKey({ bot_id, workspace_id });

        if (on) modes[conversation] = true;
        else delete modes[conversation];

        localStorage.setItem(key, JSON.stringify(modes));
    } catch {}
}
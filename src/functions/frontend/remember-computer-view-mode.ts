import { AppData } from "@/src/data/app-data";
import type { ComputerViewMode } from "@/src/dict/computer-dict";

/**
 * Records the mode a computer is viewed in on this device, so the next
 * open starts there (`readComputerViewMode`). Best effort.
 */
export default function rememberComputerViewMode({ computer_id, mode }: { computer_id: number; mode: ComputerViewMode }) {
    try {
        const key = AppData["ComputerViewModeStorageKey"];
        const stored = JSON.parse(localStorage.getItem(key) || "{}");
        const modes = stored && typeof stored == "object" && !Array.isArray(stored) ? stored : {};

        if (modes[String(computer_id)] == mode) return;

        modes[String(computer_id)] = mode;
        localStorage.setItem(key, JSON.stringify(modes));
    } catch {}
}

import { AppData } from "@/src/data/app-data";

/**
 * The mode a computer was last viewed in on this device
 * (`rememberComputerViewMode`), if any.
 */
export default function readComputerViewMode({ computer_id }: { computer_id: number }): string | undefined {
    try {
        const stored = JSON.parse(localStorage.getItem(AppData["ComputerViewModeStorageKey"]) || "{}");
        const mode = stored?.[String(computer_id)];

        return typeof mode == "string" ? mode : undefined;
    } catch {
        return undefined;
    }
}

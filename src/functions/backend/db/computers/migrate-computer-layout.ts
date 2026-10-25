import parseJobJson from "@/src/bots-queue/parse-job-json";
import { AppData } from "@/src/data/app-data";
import logEvent from "@/src/functions/backend/logger";
import provisionComputer from "./provision-computer";

type Params = {
    computer_id: number;
    /**
     * Its container's `metadata`.
     */
    metadata?: string | null;
};

/**
 * Recreates a computer whose container still mounts its whole home (set up
 * before only `AppData.ComputerWorkspaceDir` was mounted), so its bots work
 * in the workspace alone. `provisionComputer` moves the old home aside
 * (`prepareComputerDataDir`) and records the layout, so this runs once per
 * computer. Returns whether it did.
 */
export default async function migrateComputerLayout({ computer_id, metadata }: Params) {
    const layout = parseJobJson({ text: metadata || "" })?.layout;

    if (layout == AppData.ComputerWorkspaceLayout) return false;

    await provisionComputer({ computer_id });

    await logEvent({
        title: `Computer #${computer_id} now mounts only its workspace`,
        category: "system",
        plain_text: `Recreated computer #${computer_id} so only ${AppData.ComputerWorkspaceDir} is kept; its old home was moved aside and kept on disk.`,
        metadata: { computer_id },
    });

    return true;
}

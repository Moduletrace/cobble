import parseJobJson from "@/src/bots-queue/parse-job-json";
import { AppData } from "@/src/data/app-data";
import logEvent from "@/src/functions/backend/logger";
import isComputerBusy from "./is-computer-busy";
import provisionComputer from "./provision-computer";

type Params = {
    computer_id: number;
    /**
     * Its container's `metadata`.
     */
    metadata?: string | null;
};

/**
 * Recreates a computer whose container was set up with an older layout
 * (`AppData.ComputerWorkspaceLayout`: an older image, its whole home
 * mounted, or its browser profile left in the container), so it runs the
 * current image with only its workspace and browser profile mounted.
 * `provisionComputer` moves an old home aside (`prepareComputerDataDir`)
 * and records the layout, so this runs once per computer. Waits for a
 * later sync while a job works on it. Returns whether it did.
 */
export default async function migrateComputerLayout({ computer_id, metadata }: Params) {
    const layout = parseJobJson({ text: metadata || "" })?.layout;

    if (layout == AppData.ComputerWorkspaceLayout) return false;
    if (await isComputerBusy({ computer_id })) return false;

    await provisionComputer({ computer_id });

    await logEvent({
        title: `Computer #${computer_id} moved to the current computer image`,
        category: "system",
        plain_text: `Recreated computer #${computer_id} on the current image (layout ${AppData.ComputerWorkspaceLayout}); ${AppData.ComputerWorkspaceDir} and its browser profile (${AppData.ComputerBrowserProfileDir}) were kept, and an old home, if any, was moved aside and kept on disk.`,
        metadata: { computer_id },
    });

    return true;
}

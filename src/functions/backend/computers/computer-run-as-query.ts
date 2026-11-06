import type { ComputerRunAs } from "@/src/utils/computer-work-dirs";

/**
 * A worker's `run_as` for the agent's GET routes (`&run_as_bot_id=...`),
 * or nothing for the computer's own user.
 */
export default function computerRunAsQuery({ run_as }: { run_as?: ComputerRunAs | null }) {
    if (!run_as) return "";

    return `&run_as_bot_id=${run_as.bot_id}${run_as.workspace_id ? `&run_as_workspace_id=${run_as.workspace_id}` : ""}`;
}

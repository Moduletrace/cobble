import warnFullComputerWorkspaces from "@/src/functions/backend/db/computers/warn-full-computer-workspaces";

/**
 * Reports every computer whose workspace is nearly full
 * (`warnFullComputerWorkspaces`): it is the one folder on a computer
 * mounted from the data volume, so it is what can fill the host, and a bot
 * only ever finds out when a write is refused mid-run.
 */
export default async function cronWarnComputerWorkspaces() {
    const full = await warnFullComputerWorkspaces();

    return { nearly_full: full.map((entry) => entry.computer_id) };
}
import type { InstallRequestStatus } from "@/src/dict/install-request-dict";

type Params = {
    request_id: number;
    status: InstallRequestStatus;
    /**
     * What was asked for, e.g. "apt: jq, pip: rich".
     */
    asked: string;
    /**
     * The coordinator's note, or why the request failed.
     */
    answer?: string | null;
};

/**
 * The coordinator's answer to a worker's install request, as it lands in
 * the worker's conversation (shown as from the coordinator, read by the
 * model as data): what happened, its note, and what to do next.
 */
export default function installOutcomeMessage({ request_id, status, asked, answer }: Params) {
    const note = answer?.trim() || "";
    const head =
        status == "installed"
            ? `I installed what you asked for (request #${request_id}: ${asked}).`
            : status == "refused"
              ? `I didn't install what you asked for (request #${request_id}: ${asked}).`
              : `Your install request #${request_id} (${asked}) didn't get an answer.`;
    const next =
        status == "installed"
            ? `Check it's there (command -v, or import it), then carry on with the work that needed it: start the task again.`
            : status == "refused"
              ? `Don't ask for the same again. Find another way that needs no install, or tell the user what you'd need and why.`
              : `Tell the user, and ask again later if it's still needed.`;

    return [head, note, next].filter(Boolean).join("\n\n");
}

/**
 * A video job as the app reads it, whichever provider holds it.
 */
export type VideoJob = {
    id: string;
    /**
     * `working` until it's done one way or the other.
     */
    state: "working" | "done" | "failed";
    /**
     * Why it failed (or ended without a video), when it says.
     */
    error?: string;
    /**
     * How many videos it made, once done (OpenRouter lists them; OpenAI's
     * job always makes one).
     */
    outputs: number;
    /**
     * USD, when the provider says.
     */
    cost?: number;
};

const Working = ["pending", "queued", "in_progress", "processing", "running"];
const Done = ["completed", "succeeded"];

/**
 * Reads a video job's answer, from submitting or checking on it:
 * OpenRouter's (`pending`, `in_progress`, `completed`, `failed`,
 * `cancelled`, `expired`, `unsigned_urls`, `usage.cost`) or OpenAI's
 * (`queued`, `in_progress`, `completed`, `failed`, `error.message`). Null
 * when it carries no job id. An unknown status counts as still working;
 * the wait's own limit ends it.
 */
export default function readVideoJob({ json }: { json: any }): VideoJob | null {
    const id = typeof json?.id == "string" && json.id ? json.id : null;

    if (!id) return null;

    const status = String(json?.status || "").toLowerCase();
    const raw_error = json?.error;
    const error =
        typeof raw_error == "string"
            ? raw_error
            : typeof raw_error?.message == "string"
              ? raw_error.message
              : undefined;
    const cost = typeof json?.usage?.cost == "number" ? json.usage.cost : undefined;
    const outputs = Array.isArray(json?.unsigned_urls) ? json.unsigned_urls.length : 1;

    if (Done.includes(status)) {
        return { id, state: "done", outputs: Math.max(outputs, 1), cost };
    }

    if (Working.includes(status) || !status) {
        return { id, state: "working", outputs: 0, cost };
    }

    return {
        id,
        state: "failed",
        error: error || (status == "expired" ? "It took too long and expired." : status == "cancelled" ? "It was cancelled." : `It ended as ${status}.`),
        outputs: 0,
        cost,
    };
}

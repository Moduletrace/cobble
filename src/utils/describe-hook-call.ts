import type { BotHookCall } from "@/src/types";

type Params = {
    call: BotHookCall;
};

/**
 * One hook call in a line, as `search_hook_calls` lists it for a bot: its
 * id, hook, when (UTC), status, then the start of what it sent and what
 * its run answered, on one line each. What it sent is marked as outside
 * data.
 */
export default function describeHookCall({ call }: Params) {
    const flat = (text?: string | null) => String(text || "").replace(/\s+/g, " ").trim();
    const when = call.created_at ? new Date(Number(call.created_at)).toISOString() : "unknown time";
    const head = [
        `Call #${call.id} to hook #${call.hook_id} "${call.hook_title || "Hook"}"`,
        when,
        call.status || "unknown",
        call.error ? `error: ${flat(call.error)}` : "",
    ]
        .filter(Boolean)
        .join(", ");

    const lines = [head];

    if (call.payload) lines.push(`  sent (outside data): ${JSON.stringify(flat(call.payload))}`);
    if (call.response) lines.push(`  ${call.status == "failed" ? "run failed" : "your run answered"}: ${flat(call.response)}`);

    return lines.join("\n");
}

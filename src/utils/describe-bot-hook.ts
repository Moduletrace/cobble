import type { BotHookWithNames } from "@/src/types";

type Params = {
    hook: BotHookWithNames;
};

/**
 * One hook as a bot reads it: id, name, what calls it, where it runs, its
 * state, runs and last call (ISO, UTC), and the last error if any. Never
 * its URL or any part of its token: a bot doesn't hold those.
 */
export default function describeBotHook({ hook }: Params) {
    const runs = Number(hook.run_count || 0);
    const watching = hook.source == "browser_notifications";
    const parts = [
        `#${hook.id} "${hook.title}"`,
        watching
            ? `called by browser notifications on computer ${hook.watch_computer_id}${hook.watch_computer_name ? ` (${hook.watch_computer_name})` : ""}${
                  hook.watch_filter ? `, only those containing "${hook.watch_filter}"` : ""
              }`
            : `called at its URL${hook.has_signing_secret ? " (signed calls only)" : ""}`,
        hook.workspace_name ? `in the workspace ${hook.workspace_name}` : `in your own chat`,
        hook.computer_id ? `on computer ${hook.computer_id}` : "",
        hook.enabled ? "on" : "paused",
        `${runs} run${runs == 1 ? "" : "s"} so far`,
        hook.last_called_at ? `last called ${new Date(Number(hook.last_called_at)).toISOString()}` : "never called",
        hook.last_error ? `last error: ${hook.last_error}` : "",
    ];

    return parts.filter(Boolean).join(", ");
}

import type { BotHookWithNames } from "@/src/types";
import relativeTime from "./relative-time";

type Params = {
    hook: BotHookWithNames;
    now?: number;
    /**
     * Shown by default; left out where the conversation already is the
     * bot's (or the workspace's).
     */
    show_bot?: boolean;
    show_workspace?: boolean;
};

/**
 * The line under a hook's name: whose it is, where it runs, which
 * computer's notifications it gets (and its filter), how many runs
 * it started and when it was last called, whether calls must be signed,
 * then why its last call or run failed.
 */
export default function hookSubtitle({ hook, now = Date.now(), show_bot = true, show_workspace = true }: Params) {
    const runs = Number(hook.run_count || 0);

    return [
        show_bot ? hook.bot_name || "A bot" : "",
        show_workspace ? hook.workspace_name || "" : "",
        hook.source == "browser_notifications"
            ? `notifications on ${hook.watch_computer_name || "a computer"}${hook.watch_filter ? ` with "${hook.watch_filter}"` : ""}`
            : "",
        `${runs} ${runs == 1 ? "run" : "runs"}`,
        hook.last_called_at ? `called ${relativeTime({ at: hook.last_called_at, now })}` : "never called",
        hook.has_signing_secret ? "signed" : "",
        hook.last_error || "",
    ]
        .filter(Boolean)
        .join(" · ");
}

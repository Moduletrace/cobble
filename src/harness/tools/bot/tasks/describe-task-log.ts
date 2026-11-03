import type { BUN_SQLITE_COBBLE_TASKS } from "@/db/types/db";
import type { TaskNote } from "@/src/types";

type Params = {
    task: BUN_SQLITE_COBBLE_TASKS;
    notes: TaskNote[];
    /**
     * The run's own bot, named "you" in the log.
     */
    bot_id: number | string;
};

/**
 * One task for a bot's run: where it is, its brief and its whole log, each
 * note with who wrote it (bot name and id, or the user) and when, so a bot
 * on a workspace-wide task sees what the others already did.
 */
export default function describeTaskLog({ task, notes, bot_id }: Params) {
    const who = task.bot_id
        ? task.bot_id == Number(bot_id)
            ? "yours"
            : `bot ${task.bot_id}'s`
        : "workspace-wide: every bot in the workspace works on it";

    const log = notes.length
        ? notes
              .map((note) => {
                  const by =
                      note.author == "user"
                          ? "the user"
                          : Number(note.bot_id || 0) == Number(bot_id)
                            ? `you (bot ${bot_id})`
                            : `${note.bot_name || "a bot"} (bot ${note.bot_id || "?"})`;
                  const at = note.created_at ? new Date(Number(note.created_at)).toISOString().slice(0, 16).replace("T", " ") : "?";

                  return `- ${at} UTC, ${by}: ${String(note.text || "").trim()}`;
              })
              .join("\n")
        : "- Nothing logged yet.";

    return [
        `#${task.id} [${task.status}] ${task.title} (${task.workspace_id ? `in workspace ${task.workspace_id}, ` : ""}${who})`,
        task.status == "blocked" && task.blocked_reason ? `Blocked: ${task.blocked_reason}` : "",
        `Brief:\n${task.description?.trim() || "(none)"}`,
        `Log, oldest first:\n${log}`,
    ]
        .filter(Boolean)
        .join("\n\n");
}

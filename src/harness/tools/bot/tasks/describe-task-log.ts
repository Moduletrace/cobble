import type { BUN_SQLITE_COBBLE_TASKS } from "@/db/types/db";
import type { TaskFile, TaskNote, TaskWithNames } from "@/src/types";

type Params = {
    /**
     * The task row, with `parent_title` when it is a part (`grab-tasks`).
     */
    task: BUN_SQLITE_COBBLE_TASKS & {
        /**
         * Its parent's title, read for a part (`grab-tasks`' join, or the
         * caller's lookup).
         */
        parent_title?: string | null;
    };
    notes: TaskNote[];
    /**
     * What's filed on it (`grabTaskMedia`), so a bot can name, check and
     * unlink them.
     */
    files?: TaskFile[];
    /**
     * Its parts, when it is workspace-wide: each with its status and
     * whose it is, so a bot sees what is already split off.
     */
    parts?: TaskWithNames[];
    /**
     * The run's own bot, named "you" in the log.
     */
    bot_id: number | string;
};

/**
 * One task for a bot's run: where it is, its brief and its whole log, each
 * note with who wrote it (bot name and id, or the user) and when, so a bot
 * on a workspace-wide task sees what the others already did, and its files
 * (a bot file by its `[file:ID]` ref, a user's upload by name).
 */
export default function describeTaskLog({ task, notes, files = [], parts = [], bot_id }: Params) {
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

    const filed = files.length
        ? files
              .map(
                  (file) =>
                      `- ${file.kind}: ${file.bot_file_id ? `[file:${file.bot_file_id}] ` : "the user's upload "}${file.name}${file.missing ? " (its bytes are gone)" : ""}`,
              )
              .join("\n")
        : "";

    const split = parts.length
        ? parts
              .map((part) => {
                  const owner = part.bot_id ? part.bot_name || `bot ${part.bot_id}` : "nobody";
                  const open = part.status == "done" || part.status == "cancelled" ? "" : " (open)";

                  return `- #${part.id} [${part.status}]${open} ${part.title}, ${owner}${Number(part.bot_id || 0) == Number(bot_id) ? " (yours)" : ""}`;
              })
              .join("\n")
        : "";

    return [
        `#${task.id} [${task.status}] ${task.title} (${task.workspace_id ? `in workspace ${task.workspace_id}, ` : ""}${who})`,
        task.parent_task_id
            ? `A part of task #${task.parent_task_id}${task.parent_title ? ` "${task.parent_title}"` : ""}: one piece of that work. The parent stays open until someone verifies all its parts, so don't mark it done from here.`
            : "",
        task.status == "blocked" && task.blocked_reason ? `Blocked: ${task.blocked_reason}` : "",
        `Brief:\n${task.description?.trim() || "(none)"}`,
        split ? `Parts (${parts.length}):\n${split}` : "",
        filed ? `Files (${files.length}):\n${filed}` : "",
        `Log, oldest first:\n${log}`,
    ]
        .filter(Boolean)
        .join("\n\n");
}

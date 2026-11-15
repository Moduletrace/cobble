import type { BUN_SQLITE_COBBLE_TASKS } from "@/db/types/db";
import type { TaskFile, TaskNote, TaskWithNames } from "@/src/types";

type Params = {
    /**
     * The task row, with `parent_title` when it is a subtask (`grab-tasks`).
     */
    task: BUN_SQLITE_COBBLE_TASKS & {
        /**
         * Its parent's title, read for a subtask (`grab-tasks`' join, or the
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
     * Its subtasks, when it is workspace-wide: each with its status and
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
              .map((subtask) => {
                  const owner = subtask.bot_id ? subtask.bot_name || `bot ${subtask.bot_id}` : "nobody";
                  const open = subtask.status == "done" || subtask.status == "cancelled" ? "" : " (open)";

                  return `- #${subtask.id} [${subtask.status}]${open} ${subtask.title}, ${owner}${Number(subtask.bot_id || 0) == Number(bot_id) ? " (yours)" : ""}`;
              })
              .join("\n")
        : "";

    return [
        `#${task.id} [${task.status}] ${task.title} (${task.workspace_id ? `in workspace ${task.workspace_id}, ` : ""}${who})`,
        task.parent_task_id
            ? `A subtask of task #${task.parent_task_id}${task.parent_title ? ` "${task.parent_title}"` : ""}: one piece of that work. The parent stays open until someone verifies all its subtasks, so don't mark it done from here.`
            : "",
        task.status == "blocked" && task.blocked_reason ? `Blocked: ${task.blocked_reason}` : "",
        `Brief:\n${task.description?.trim() || "(none)"}`,
        split ? `Subtasks (${parts.length}):\n${split}` : "",
        filed ? `Files (${files.length}):\n${filed}` : "",
        `Log, oldest first:\n${log}`,
    ]
        .filter(Boolean)
        .join("\n\n");
}

/**
 * Tools that leave something behind: a file written, a record changed, a
 * graphic or a picture made, work handed on. `runTextLoop` reads this to
 * tell a run that has produced something from one that has only been
 * reading, so a run measuring its way through a whole budget is told to
 * land a piece of the work while there is still room (`commitEarlyNote`).
 *
 * `computer_bash` is deliberately not here: it is the one tool that both
 * reads and writes (a `SELECT` and an `UPDATE` look the same to the
 * harness), so counting it would let a shell-driven run research its way to
 * the ceiling and never be told. A run that has already landed work that
 * way says so in its answer, and the note asks it to.
 */
export const WritingToolNames: readonly string[] = [
    "write_file",
    "import_file",
    "copy_file",
    "move_file",
    "delete_file",
    "computer_write_file",
    "computer_edit_file",
    "make_pdf",
    "create_graphic",
    "update_graphic",
    "set_picture",
    "transform_image",
    "generate_image",
    "generate_video",
    "create_task",
    "update_task",
    "delete_task",
    "create_schedule",
    "update_schedule",
    "delete_schedule",
    "hand_over_schedule",
    "hand_over_task",
    "update_memory",
    "update_instructions",
    "set_bot_workspace_instructions",
    "capture_secret",
    "request_install",
    "answer_install_request",
    "start_task",
    "delegate_task",
    "ask_crew",
    "create_bot",
    "update_bot",
    "delete_bot",
    "create_workspace",
    "update_workspace",
    "delete_workspace",
    "add_bot_to_workspace",
    "remove_bot_from_workspace",
    "assign_computer",
    "set_workspace_computer",
    "set_bot_type",
    "set_extension_access",
    "set_user_workspace_role",
];

/**
 * Whether a successful call to this tool produced something.
 */
export default function isWritingTool({ name }: { name: string }) {
    return WritingToolNames.includes(name);
}
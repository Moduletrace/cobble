/**
 * The bot's own tools, by family (`groupTools`). A run short of window keeps
 * a whole family out of every turn and the model loads it by name with
 * `load_tools` (`deferredToolsNote`), while a model with room for them keeps
 * every one inline and pays no loading turn at all.
 *
 * A family is worth a group when it is a coherent thing to load at once:
 * the tracker's tools are used together or not at all, the same for a
 * routine's or a knowledgebase's. The tools a run cannot act without
 * (`send_reply`, `ask_user`, `suggest_next_steps`, `start_task`,
 * `write_file`, `import_file`) are in none of them, and `runTextLoop`
 * refuses to defer them whatever their size.
 */
export const ToolGroups: Record<string, readonly string[]> = {
    computer: [
        "computer_bash",
        "computer_read_file",
        "computer_write_file",
        "computer_edit_file",
        "search_computers",
        "export_file",
        "request_install",
        "capture_secret",
        "ask_user_to_take_over",
    ],
    crew: [
        "create_bot",
        "update_bot",
        "delete_bot",
        "find_bot",
        "create_workspace",
        "update_workspace",
        "delete_workspace",
        "find_workspace",
        "list_workspace_bots",
        "list_workspace_people",
        "set_user_workspace_role",
        "set_bot_workspace_instructions",
        "set_workspace_computer",
        "add_bot_to_workspace",
        "remove_bot_from_workspace",
        "assign_computer",
        "set_bot_type",
        "delegate_task",
        "hand_over_task",
        "hand_over_schedule",
        "ask_bot",
        "list_asks",
        "update_requester",
        "answer_install_request",
    ],
    extensions: [
        "list_extensions",
        "propose_custom_tool",
        "update_custom_tool",
        "propose_mcp_server",
        "update_mcp_server",
        "propose_skill",
        "update_skill",
        "delete_extension",
        "set_extension_access",
    ],
    files: [
        "list_files",
        "read_file",
        "copy_file",
        "move_file",
        "delete_file",
        "make_pdf",
        "transform_image",
        "generate_image",
        "generate_video",
    ],
    graphics: ["create_graphic", "update_graphic", "read_graphic", "list_graphics"],
    hooks: ["list_hooks", "propose_hook", "pause_hook", "delete_hook", "search_hook_calls", "read_hook_call"],
    knowledgebase: [
        "list_knowledgebases",
        "search_knowledgebase",
        "read_knowledgebase_document",
        "save_knowledgebase",
        "add_knowledgebase_document",
        "delete_knowledgebase_document",
        "delete_knowledgebase",
        "retry_failed_documents",
        "reindex_knowledgebase",
    ],
    memory: ["update_memory", "update_instructions", "set_picture", "read_settings", "read_message_usage"],
    plans: ["create_plan", "update_plan", "cancel_plan", "complete_plan_step"],
    schedules: [
        "create_schedule",
        "update_schedule",
        "delete_schedule",
        "list_schedules",
        "report_run_failed",
    ],
    secrets: ["request_secret", "show_secret"],
    sessions: [
        "search_past_sessions",
        "read_past_session",
        "send_message",
        "continue_in_new_session",
        "react_to_message",
    ],
    tasks: ["list_tasks", "create_task", "update_task", "delete_task"],
};

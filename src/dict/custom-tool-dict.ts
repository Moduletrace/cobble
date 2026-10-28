/**
 * What a custom tool does when a bot calls it. `http` calls an API from the
 * app, `script` runs code on the run's computer, `prompt` runs one model
 * turn with a filled-in prompt.
 */
export const CustomToolKinds = [
    {
        title: "HTTP request",
        value: "http",
        description: "Calls an API from the app and returns the response.",
    },
    {
        title: "Script on a computer",
        value: "script",
        description: "Runs code on the bot's computer and returns what it prints.",
    },
    {
        title: "Prompt",
        value: "prompt",
        description: "Runs one model turn with a filled-in prompt and returns the answer.",
    },
] as const;

export type CustomToolKind = (typeof CustomToolKinds)[number]["value"];

/**
 * How a tool's last run went (a bot's call or a try from its settings):
 * `ok`, `error` (see its `last_error`), or `untested` before its first run
 * and after it's edited. Bad arguments from a bot don't count.
 */
export const CustomToolStatuses = [
    { title: "Not run yet", value: "untested" },
    { title: "Worked", value: "ok" },
    { title: "Failed", value: "error" },
] as const;

export type CustomToolStatus = (typeof CustomToolStatuses)[number]["value"];

export const CustomToolHttpMethods = ["GET", "POST", "PUT", "PATCH", "DELETE"] as const;

export type CustomToolHttpMethod = (typeof CustomToolHttpMethods)[number];

/**
 * Languages a script tool runs in, with the interpreter on the computer
 * and the code editor's mode.
 */
export const CustomToolScriptLanguages = [
    { title: "Bash", value: "bash", interpreter: "bash", extension: "sh", editor_mode: "sh" },
    { title: "Python", value: "python", interpreter: "python3", extension: "py", editor_mode: "python" },
    { title: "JavaScript", value: "javascript", interpreter: "node", extension: "js", editor_mode: "javascript" },
] as const;

export type CustomToolScriptLanguage = (typeof CustomToolScriptLanguages)[number]["value"];

/**
 * Names the built-in bot tools use. A custom tool can't take one, and
 * names starting with a computer's tool prefixes are kept for them too.
 */
export const ReservedToolNames = [
    "add_bot_to_workspace",
    "ask_user",
    "ask_user_to_take_over",
    "assign_computer",
    "capture_secret",
    "create_bot",
    "create_schedule",
    "create_workspace",
    "delegate_task",
    "delete_extension",
    "delete_hook",
    "delete_schedule",
    "list_extensions",
    "list_hooks",
    "list_schedules",
    "load_skill",
    "pause_hook",
    "propose_custom_tool",
    "propose_hook",
    "propose_mcp_server",
    "propose_skill",
    "read_hook_call",
    "report_run_failed",
    "request_secret",
    "search_computers",
    "search_hook_calls",
    "send_message",
    "set_bot_workspace_instructions",
    "set_extension_access",
    "set_picture",
    "set_workspace_computer",
    "show_secret",
    "start_task",
    "update_custom_tool",
    "update_instructions",
    "update_mcp_server",
    "update_memory",
    "update_schedule",
    "update_skill",
    "update_workspace",
] as const;

export const ReservedToolPrefixes = ["sandbox_", "browser_"] as const;

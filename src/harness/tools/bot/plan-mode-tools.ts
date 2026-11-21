import { ReadKnowledgebaseDocumentToolName, SearchKnowledgebaseToolName } from "@/src/dict/knowledgebase-dict";
import { LoadSkillToolName } from "@/src/dict/skill-dict";
import type { HarnessTool } from "../../types";

/**
 * Everything a reply may still call with Plan mode on. It is an allowlist,
 * never a denylist: a tool added to a factory later is left out until it
 * is named here on purpose, so a planning run can't gain a way to write
 * just because someone shipped one.
 *
 * What is here reads (`list_*`, `read_*`, `search_*`, `find_*`), loads a
 * runbook, or puts the mode's own cards up: the plan (`create_plan`,
 * `update_plan`), the questions (`ask_user`), the suggested steps
 * (`suggest_next_steps`) and the closing answer (`send_reply`). Files are
 * read, never written or attached; tasks, schedules, hooks, memory,
 * instructions, secrets, crew changes, computers, browsers, MCP servers
 * and custom tools are all out, and `load_tools` with them, so a deferred
 * tool can't be pulled back in.
 */
export const PlanModeToolNames = [
    "send_reply",
    "create_plan",
    "update_plan",
    "ask_user",
    "suggest_next_steps",
    "list_files",
    "read_file",
    "list_tasks",
    "list_schedules",
    "list_hooks",
    "search_hook_calls",
    "read_hook_call",
    "list_asks",
    "list_graphics",
    "read_graphic",
    SearchKnowledgebaseToolName,
    ReadKnowledgebaseDocumentToolName,
    LoadSkillToolName,
    "search_past_sessions",
    "read_past_session",
    "search_computers",
    "find_bot",
    "find_workspace",
    "list_workspace_bots",
    "list_workspace_people",
    "list_extensions",
    "list_knowledgebases",
    "read_settings",
    "read_message_usage",
] as const;

const allowed = new Set<string>(PlanModeToolNames);

/**
 * The run's tools, held to the plan-mode allowlist. Applied after every
 * factory has had its say, so the mode holds whatever the run's bot type,
 * workspace, extensions, browsers or skills would otherwise hand it.
 */
export default function filterPlanModeTools({ tools }: { tools: HarnessTool[] }): HarnessTool[] {
    return tools.filter((tool) => allowed.has(tool.name));
}
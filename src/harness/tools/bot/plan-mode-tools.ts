import { ReadKnowledgebaseDocumentToolName, SearchKnowledgebaseToolName } from "@/src/dict/knowledgebase-dict";
import { LoadSkillToolName } from "@/src/dict/skill-dict";
import type { HarnessTool } from "../../types";

/**
 * Everything a reply may still call with Plan mode on. It is an allowlist,
 * never a denylist: a tool added to a factory later is refused until it
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
 * What a write tool called in Plan mode answers the model, worded like
 * `send_reply`'s refusal. It says the tool did nothing and why, so the
 * bot tells the user Plan mode stopped it instead of inventing a reason
 * or looking for another way in. A tool that vanished from the list
 * instead read as "there is no tool called ...", which was untrue.
 */
function planModeRefusal({ name }: { name: string }) {
    return `Plan mode is on for this reply: it plans and reads, and changes nothing, so ${name} did not run and nothing was changed. Say plainly that Plan mode stops it, and that they can turn it off (the button under your answer, or Tab) to have it done; otherwise finish with send_reply.`;
}

/**
 * The run's tools with every write held off. Applied after every factory
 * has had its say, so the mode holds whatever the run's bot type,
 * workspace, extensions, browsers or skills would otherwise hand it.
 *
 * The tools stay listed, with their own name, description and schema: the
 * bot is meant to see the write it is reaching for and be told why it
 * can't, rather than wonder why the tool it needs doesn't exist. Only
 * `run` is replaced, and it throws so the call is reported as failed.
 * `load_tools` is here too, so a deferred MCP or browser tool can never
 * be pulled into a planning run.
 */
export default function gatePlanModeTools({ tools }: { tools: HarnessTool[] }): HarnessTool[] {
    return tools.map((tool) =>
        allowed.has(tool.name)
            ? tool
            : {
                  ...tool,
                  run: async () => {
                      throw new Error(planModeRefusal({ name: tool.name }));
                  },
              },
    );
}

import { ReadKnowledgebaseDocumentToolName, SearchKnowledgebaseToolName } from "@/src/dict/knowledgebase-dict";

/**
 * Tools that only read. Called twice with the same arguments in one run
 * they answer the same thing, so `runTextLoop` answers the second call from
 * the first instead of running it again (`repeatToolCallKey`): a run that
 * re-reads the same file or re-lists the same folder stops paying for it
 * twice, in the call and in the transcript it resends every turn.
 *
 * Only reads belong here. A write, a command, or anything else with a side
 * effect clears everything remembered, so a read is reused only while
 * nothing has run that could have changed its answer.
 */
export const RepeatableToolNames: readonly string[] = [
    "read_file",
    "list_files",
    "computer_read_file",
    SearchKnowledgebaseToolName,
    ReadKnowledgebaseDocumentToolName,
    "list_tasks",
    "list_extensions",
    "list_graphics",
    "read_graphic",
    "list_hooks",
    "read_hook_call",
    "search_hook_calls",
    "list_schedules",
    "list_workspace_bots",
    "list_workspace_people",
    "find_bot",
    "find_workspace",
    "search_past_sessions",
    "read_past_session",
    "search_computers",
];

/**
 * Whether a tool call may be answered from an earlier identical one.
 */
export default function isRepeatableTool({ name }: { name: string }) {
    return RepeatableToolNames.includes(name);
}
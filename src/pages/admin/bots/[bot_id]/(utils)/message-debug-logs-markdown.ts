import type { BotTraceJob } from "@/src/types";
import traceEntryView from "./trace-entry-view";
import traceJobView from "./trace-job-view";

type Params = {
    /**
     * The message the logs belong to, named at the top.
     */
    message_id: number;
    /**
     * The runs behind it, oldest first, as the debug logs tab reads them.
     */
    jobs: BotTraceJob[];
    /**
     * When the copy was made.
     */
    now: number;
    /**
     * A timestamp as the reader sees it; local time by default.
     */
    format_time?: (time: number) => string;
};

/**
 * A message's debug logs as one markdown document, for a bug report or a
 * note: every run behind it, then each step in order - what it was sent,
 * what it reasoned, what it asked the tools for and what they answered.
 *
 * Fences are made longer than any run of backticks in the text, so a
 * result that holds markdown code of its own never closes its block.
 */
export default function messageDebugLogsMarkdown({
    message_id,
    jobs,
    now,
    format_time = (time) =>
        new Date(time).toLocaleString(undefined, {
            dateStyle: "medium",
            timeStyle: "short",
        }),
}: Params) {
    const out: string[] = [
        "# Debug logs",
        "",
        `- Message: #${message_id}`,
        `- Runs: ${jobs.length}`,
        `- Copied: ${format_time(now)}`,
        "",
    ];

    for (const job of jobs) {
        const view = traceJobView({ job });

        out.push(`## ${view.title} (${view.kind_label}, ${view.status_label})`, "");

        if (job.created_at) out.push(`Started ${format_time(job.created_at)}`, "");

        if (!job.traces.length) out.push("No steps were kept for this run.", "");

        for (const entry of job.traces) out.push(...entryLines({ entry, format_time }));
    }

    return `${out.join("\n").trimEnd()}\n`;
}

function entryLines({ entry, format_time }: { entry: BotTraceJob["traces"][number]; format_time: (time: number) => string }) {
    const view = traceEntryView({ entry });
    const out: string[] = [`### ${view.title}${view.failed ? " (failed)" : ""}`, ""];

    if (entry.created_at) out.push(`At ${format_time(entry.created_at)}`, "");

    if (view.meta.length) out.push(view.meta.join(", "), "");

    if (view.tools?.length) out.push(`Asked for: ${view.tools.join(", ")}`, "");

    if (view.reasoning) out.push("**Reasoned**", "", fence({ text: view.reasoning }), "");

    if (view.text) out.push(entry.kind == "event" ? "**What happened**" : "**Answered**", "", fence({ text: view.text }), "");

    if (view.arguments) out.push("**Arguments**", "", fence({ text: view.arguments, language: "json" }), "");

    if (view.result) out.push("**Answer**", "", fence({ text: view.result }), "");

    return out;
}

/**
 * The text in a fenced block, with a fence longer than any backticks it
 * holds.
 */
function fence({ text, language = "" }: { text: string; language?: string }) {
    const longest = Math.max(0, ...(text.match(/`+/g) || []).map((run) => run.length));
    const marker = "`".repeat(Math.max(3, longest + 1));

    return `${marker}${language}\n${text}\n${marker}`;
}
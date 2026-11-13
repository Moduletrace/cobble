import type { CurrentRunLimits, RunUsage, RunUsageMessage } from "@/src/functions/backend/db/usage/grab-run-usage";
import { isUnlimitedLimit, type RunLimit } from "./run-limit";
import generalSettingsRef from "./general-settings-ref";

const count = (value: number) => value.toLocaleString("en-US");

/**
 * A limit the way a person reads it: its number, "unlimited", or the
 * phrase used when the run never recorded one.
 */
const limitText = ({ value, none }: { value: RunLimit | null; none: string }) => {
    if (value === null) return none;
    if (isUnlimitedLimit(value)) return "unlimited";

    return count(value);
};

const when = (value: number | null) => (value ? new Date(value).toISOString().replace("T", " ").slice(0, 16) + " UTC" : "now");

const limitsLine = ({ limits }: { limits: RunUsage["limits"] }) => {
    if (!limits) return "Their calls recorded no limits (made before runs kept them).";

    return [
        `The run was allowed ${limitText({ value: limits.steps, none: "an unrecorded number of" })} steps,`,
        `${limitText({ value: limits.run_tokens, none: "an unrecorded number of" })} prompt tokens in all,`,
        `and ${limits.context_tokens === null ? "an unrecorded working context" : `${limitText({ value: limits.context_tokens, none: "an unrecorded working context" })} tokens of working context`} per turn.`,
    ].join(" ");
};

const changeLimitsLine = [
    `To change them: ${generalSettingsRef({ section: "run-limits", field: "task_steps" })} steps per task,`,
    `${generalSettingsRef({ section: "run-limits", field: "reply_steps" })} per chat reply,`,
    `${generalSettingsRef({ section: "run-limits", field: "unattended_steps" })} per routine or hook call,`,
    `${generalSettingsRef({ section: "run-limits", field: "run_tokens" })} tokens per run,`,
    `${generalSettingsRef({ section: "run-limits", field: "context_tokens" })} working context.`,
].join(" ");

const costDriversLine = `More steps is the usual reason a run costs more than the work looks: every turn resends the prompt, the tool list and the whole transcript, so a long run grows with the square of its turns. A long session makes every reply cost more too (${generalSettingsRef({ section: "sessions", field: "max_messages" })} starts a new one sooner).`;

const todayLine = ({ current }: { current: CurrentRunLimits }) =>
    `Today's settings: ${limitText({ value: current.task_steps, none: "an unrecorded number of" })} steps per task, ${limitText({ value: current.reply_steps, none: "an unrecorded number of" })} per reply, ${limitText({ value: current.unattended_steps, none: "an unrecorded number of" })} per routine or hook call, ${limitText({ value: current.run_tokens, none: "an unrecorded number of" })} prompt tokens per run, ${limitText({ value: current.context_tokens, none: "an unrecorded working context" })} tokens of working context per turn.`;

/**
 * What one run spent, in the shape a bot reports it: what it cost, the
 * limits it ran under against today's, what it did with the steps, and
 * its calls. Pointing at a setting is the reader's next step, so the two
 * numbers that most often explain a big total (steps taken and prompt
 * tokens sent) are named on their own.
 */
export default function describeRunUsage({ usage }: { usage: RunUsage }) {
    const lines: string[] = [];
    const { target, totals, tools } = usage;

    lines.push(
        target?.kind == "job"
            ? `# This run so far (job #${target.id})`
            : target
              ? `# Message #${target.id} (${target.author == "user" ? "from the user" : "an answer from the bot"}, ${when(target.created_at)})`
              : "# Nothing found",
    );

    if (!target) {
        lines.push("That message or run has no model calls recorded, so there is nothing to explain.");
        return lines.join("\n\n");
    }

    if (totals) {
        lines.push(
            `${count(totals.calls)} model ${totals.calls == 1 ? "call" : "calls"}: ${count(totals.prompt_tokens)} prompt tokens (${count(totals.cached_tokens || 0)} served from the model's cache) and ${count(totals.completion_tokens)} completion tokens, ${count(totals.total_tokens)} in all${totals.cost ? `, about $${totals.cost.toFixed(4)}` : ""}.`,
        );
    }

    lines.push(
        limitsLine({ limits: usage.limits }),
        todayLine({ current: usage.current_limits }),
        changeLimitsLine,
        costDriversLine,
    );

    if (tools?.calls) {
        const list = tools.tools
            .slice(0, 12)
            .map((tool) => `${tool.name} ${count(tool.count)}${tool.failed ? ` (${count(tool.failed)} failed)` : ""}`)
            .join(", ");

        lines.push(`Tools it called: ${count(tools.calls)} calls, ${list}.`);
    } else if (target.kind == "message") {
        lines.push("It called no tools.");
    }

    if (usage.calls.length) {
        lines.push(
            "Calls, oldest first:",
            usage.calls
                .slice(0, 30)
                .map((call) => {
                    const fallback = call.settings?.fell_back_from?.length
                        ? ` (after ${call.settings.fell_back_from.join(", ")} failed)`
                        : "";

                    return `- ${when(call.created_at)} ${call.harness} ${call.provider_name || "?"}/${call.model_slug || call.settings?.model_source || "?"}: ${count(call.prompt_tokens)} prompt (${count(call.cached_tokens)} cached) + ${count(call.completion_tokens)} completion${fallback}`;
                })
                .join("\n"),
            usage.calls.length > 30 ? `(${count(usage.calls.length - 30)} more calls not listed; the totals count them.)` : "",
        );
    }

    return lines.filter(Boolean).join("\n\n");
}

/**
 * A session's latest messages with what each cost, so a bot can find the
 * answer being asked about and then read it by id.
 */
export function describeMessageUsageList({ messages }: { messages: RunUsageMessage[] }) {
    if (!messages.length) return "No messages with model calls yet.";

    return [
        "The session's latest messages, newest first. Read one by id to see what it did.",
        messages
            .map(
                (message) =>
                    `- #${message.id} ${when(message.created_at)} ${message.author == "user" ? "from the user" : `answer from the bot`}: ${count(message.calls)} calls, ${count(message.total_tokens)} tokens (${count(message.prompt_tokens)} prompt, ${count(message.completion_tokens)} completion)`,
            )
            .join("\n"),
    ].join("\n\n");
}
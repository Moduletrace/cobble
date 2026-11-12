import type { MessageDetails, MessageDetailsCall, MessageDetailsFailure, MessageDetailsModel } from "@/src/types";
import describeCallSettings from "@/src/utils/describe-call-settings";
import formatDuration from "@/src/utils/format-duration";
import costLabel from "./cost-label";
import failureSourceLabel from "./failure-source-label";
import harnessLabel from "./harness-label";
import messageDetailsFacts from "./message-details-facts";
import providerLabel from "./provider-label";

type Params = {
    details: MessageDetails;
    /**
     * When the copy was made.
     */
    now: number;
    /**
     * A timestamp as the reader sees it; local time by default.
     */
    format_time?: (time: number) => string;
};

type DetailLine = {
    label: string;
    value: string;
};

/**
 * Everything a message's details hold as one markdown report, for a bug
 * report or a note: the provider and model that answered and what it
 * spent, the run behind it, every model it used, every call in order and
 * every call that failed, with why. The whole message, not only the calls
 * the modal lists.
 */
export default function messageDetailsMarkdown({
    details,
    now,
    format_time = (time) =>
        new Date(time).toLocaleString(undefined, {
            dateStyle: "medium",
            timeStyle: "short",
        }),
}: Params) {
    const { totals, models, calls, failures, failed_calls, job } = details;
    const { providers, model_names, first_at, job_kind, job_took } = messageDetailsFacts({ details });
    const out: string[] = [
        "# Message details",
        "",
        ...lines([
            { label: "Message", value: `#${details.message_id}` },
            { label: "Written", value: details.created_at ? format_time(details.created_at) : "" },
            { label: providers.length > 1 ? "Providers" : "Provider", value: providers.join(", ") },
            { label: model_names.length > 1 ? "Models" : "Model", value: model_names.join(", ") },
            { label: "Tokens", value: `${totals.total_tokens.toLocaleString()} (${totals.prompt_tokens.toLocaleString()} in, ${totals.completion_tokens.toLocaleString()} out)` },
            { label: "Cost", value: costLabel({ cost: totals.cost }) },
            { label: "Model calls", value: String(totals.calls) },
            { label: "Failed calls", value: failed_calls ? String(failed_calls) : "" },
            { label: "Copied", value: format_time(now) },
        ]),
    ];

    if (!totals.calls && !failed_calls) {
        out.push(
            "",
            "No model calls were recorded for this message. It was written by the app itself (a stop, a failure notice), or before usage was recorded.",
        );
    }

    if (job) {
        out.push(
            "",
            "## Run",
            "",
            ...lines([
                { label: "Id", value: `#${job.id}` },
                { label: "Kind", value: job_kind },
                { label: "Title", value: job.title || "" },
                { label: "Status", value: job.status || "" },
                { label: "Took", value: job_took },
                { label: "Attempts", value: String(job.attempts || 1) },
                { label: "Steps", value: String(job.steps) },
            ]),
        );
    }

    if (models.length) {
        out.push("", `## ${models.length > 1 ? "Models used" : "Model used"}`, ...models.flatMap(modelBlock));
    }

    if (calls.length) {
        out.push("", "## Calls in order", "", callTable({ calls, first_at }));

        if (totals.calls > calls.length) {
            out.push("", `Showing the first ${calls.length} of ${totals.calls} calls. The totals count every one.`);
        }
    }

    if (failures.length) {
        out.push("", `## ${failures.length > 1 ? "Failed calls" : "Failed call"}`, ...failures.flatMap((failure, index) => failureBlock({ failure, index, first_at })));

        if (failed_calls > failures.length) {
            out.push("", `Showing the first ${failures.length} of ${failed_calls} failed calls.`);
        }
    }

    return `${out.join("\n").trimEnd()}\n`;
}

/**
 * A label and its value per line, skipping the ones with nothing to say.
 */
function lines(rows: DetailLine[]) {
    return rows.filter((row) => row.value).map((row) => `- **${row.label}:** ${row.value}`);
}

function modelBlock(model: MessageDetailsModel) {
    const name = model.model_name || model.model_slug || "Unknown model";
    const settings = model.settings ? describeCallSettings({ settings: model.settings, harness: model.harness }) : [];
    const out = [
        "",
        `### ${name}`,
        "",
        ...lines([
            { label: "Id", value: model.model_slug && model.model_slug != name ? model.model_slug : "" },
            { label: "Provider", value: providerLabel({ name: model.provider_name, kind: model.provider_kind }) },
            { label: "Harness", value: harnessLabel({ harness: model.harness }) },
            { label: "Calls", value: String(model.calls) },
            { label: "Tokens", value: `${model.total_tokens.toLocaleString()} (${model.prompt_tokens.toLocaleString()} in, ${model.completion_tokens.toLocaleString()} out)` },
            { label: "Cost", value: costLabel({ cost: model.cost }) },
        ]),
    ];

    if (settings.length) {
        out.push("", "| Setting | Value |", "| --- | --- |");
        out.push(...settings.map(({ label, value }) => `| ${label} | ${escapeCell({ text: value })} |`));
    }

    return out;
}

function callTable({ calls, first_at }: { calls: MessageDetailsCall[]; first_at: number }) {
    const out = [
        "| # | At | Model | Harness | Prompt | Cached | Completion | Cost |",
        "| --- | --- | --- | --- | --- | --- | --- | --- |",
    ];

    out.push(
        ...calls.map((call, index) => {
            const model = `${call.model_name || call.model_slug || "Unknown model"}${call.model_slug && call.model_name ? ` (${call.model_slug})` : ""}`;
            const fell_back = call.settings?.fell_back_from?.length ? " (fallback)" : "";

            return [
                `| ${index + 1}`,
                offsetLabel({ at: call.created_at, first_at }),
                escapeCell({ text: `${model}${fell_back}` }),
                harnessLabel({ harness: call.harness }),
                call.prompt_tokens.toLocaleString(),
                call.cached_tokens.toLocaleString(),
                call.completion_tokens.toLocaleString(),
                escapeCell({ text: costLabel({ cost: call.cost }) }),
            ].join(" | ") + " |";
        }),
    );

    return out.join("\n");
}

function failureBlock({ failure, index, first_at }: { failure: MessageDetailsFailure; index: number; first_at: number }) {
    const model = `${failure.model_name || failure.model_slug || "Unknown model"}${failure.model_slug && failure.model_name ? ` (${failure.model_slug})` : ""}`;
    const rested =
        failure.rests_until && failure.rests_until > failure.created_at
            ? formatDuration({ ms: failure.rests_until - failure.created_at })
            : "";

    return [
        "",
        `### Failure #${index + 1} · ${offsetLabel({ at: failure.created_at, first_at })}`,
        "",
        ...lines([
            { label: "Model", value: model },
            { label: "Provider", value: providerLabel({ name: failure.provider_name, kind: failure.provider_kind }) },
            { label: "Harness", value: harnessLabel({ harness: failure.harness }) },
            { label: "Picked", value: failureSourceLabel({ source: failure.source }) },
            { label: "Status", value: failure.status ? `HTTP ${failure.status}` : "No response" },
            { label: "Rested for", value: rested },
        ]),
        "",
        "> " + failure.error.split("\n").join("\n> "),
    ];
}

/**
 * When a call came after the first: "+4.2s", or "start" for the first.
 */
function offsetLabel({ at, first_at }: { at: number; first_at: number }) {
    return at > first_at ? `+${formatDuration({ ms: at - first_at })}` : "start";
}

/**
 * A value inside a table cell, kept on one line.
 */
function escapeCell({ text }: { text: string }) {
    return text.replaceAll("|", "\\|").replaceAll("\n", " ");
}

import Span from "@moduletrace/twui/layout/Span";
import Stack from "@moduletrace/twui/layout/Stack";
import { BotJobKinds } from "@/src/dict/bot-queue-dict";
import type { MessageDetails } from "@/src/types";
import formatDuration from "@/src/utils/format-duration";
import formatTokens from "@/src/utils/format-tokens";
import relativeTime from "@/src/utils/relative-time";
import costLabel from "../(utils)/cost-label";
import providerLabel from "../(utils)/provider-label";
import MessageDetailRow from "./message-detail-row";
import MessageDetailsCallRow from "./message-details-call-row";
import MessageDetailsHeading from "./message-details-heading";
import MessageDetailsModelRow from "./message-details-model-row";

type Props = {
    details: MessageDetails;
};

/**
 * How a message was generated: the provider and model that answered and
 * what it spent, then the job that ran it, every model it used and every
 * call in order.
 */
export default function MessageDetailsBody({ details }: Props) {
    const { totals, models, calls, job } = details;
    const providers = [
        ...new Set(models.map((m) => providerLabel({ name: m.provider_name, kind: m.provider_kind }))),
    ];
    const model_names = [...new Set(models.map((m) => m.model_name || m.model_slug || "Unknown model"))];
    const first_at = calls[0]?.created_at || 0;
    const job_kind = BotJobKinds.find((k) => k.value == job?.kind)?.title || job?.kind;
    const job_took =
        job?.started_at && job.finished_at ? formatDuration({ ms: job.finished_at - job.started_at }) : "";

    return (
        <Stack className="w-full gap-0! items-stretch">
            {totals.calls ? null : (
                <Span className="mb-2 text-[13px] leading-[18px] text-ink-secondary">
                    No model calls were recorded for this message. It was written by the app itself (a stop, a
                    failure notice), or before usage was recorded.
                </Span>
            )}

            <MessageDetailRow label={providers.length > 1 ? "Providers" : "Provider"} value={providers.join(", ") || "-"} />
            <MessageDetailRow label={model_names.length > 1 ? "Models" : "Model"} value={model_names.join(", ") || "-"} />
            <MessageDetailRow
                label="Tokens"
                value={`${formatTokens({ tokens: totals.total_tokens })} (${totals.prompt_tokens.toLocaleString()} in, ${totals.completion_tokens.toLocaleString()} out)`}
                title={`${totals.total_tokens.toLocaleString()} tokens`}
            />
            <MessageDetailRow label="Cost" value={costLabel({ cost: totals.cost })} />
            <MessageDetailRow label="Model calls" value={String(totals.calls)} />
            {details.created_at ? (
                <MessageDetailRow
                    label="Written"
                    value={relativeTime({ at: details.created_at })}
                    title={new Date(details.created_at).toLocaleString()}
                />
            ) : null}

            {job ? (
                <>
                    <MessageDetailsHeading>Run</MessageDetailsHeading>
                    <MessageDetailRow label="Kind" value={job_kind || "-"} />
                    {job.title ? <MessageDetailRow label="Title" value={job.title} /> : null}
                    {job.status ? <MessageDetailRow label="Status" value={job.status} /> : null}
                    {job_took ? <MessageDetailRow label="Took" value={job_took} /> : null}
                    <MessageDetailRow label="Attempts" value={String(job.attempts || 1)} />
                    <MessageDetailRow label="Steps" value={String(job.steps)} />
                </>
            ) : null}

            {models.length ? (
                <>
                    <MessageDetailsHeading>{models.length > 1 ? "Models used" : "Model used"}</MessageDetailsHeading>
                    {models.map((model) => (
                        <MessageDetailsModelRow
                            key={`${model.harness}:${model.provider_name}:${model.model_slug}`}
                            model={model}
                        />
                    ))}
                </>
            ) : null}

            {calls.length > 1 ? (
                <>
                    <MessageDetailsHeading>Calls in order (tokens in / out)</MessageDetailsHeading>
                    {calls.map((call, index) => (
                        <MessageDetailsCallRow key={call.id} call={call} index={index} first_at={first_at} />
                    ))}
                    {totals.calls > calls.length ? (
                        <Span className="mt-1 text-[12px] leading-4 text-ink-secondary">
                            {`Showing the first ${calls.length} of ${totals.calls} calls. The totals count every one.`}
                        </Span>
                    ) : null}
                </>
            ) : null}
        </Stack>
    );
}

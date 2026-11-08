import Row from "@moduletrace/twui/layout/Row";
import Span from "@moduletrace/twui/layout/Span";
import Stack from "@moduletrace/twui/layout/Stack";
import type { MessageDetailsFailure } from "@/src/types";
import formatDuration from "@/src/utils/format-duration";
import harnessLabel from "../(utils)/harness-label";
import providerLabel from "../(utils)/provider-label";

type Props = {
    failure: MessageDetailsFailure;
    index: number;
    /**
     * When the message's first call was made, so each failure reads as an
     * offset from it.
     */
    first_at: number;
};

const SourceLabels: Record<NonNullable<MessageDetailsFailure["source"]>, string> = {
    pinned: "the pick",
    fallback: "a fallback model",
    auto: "an automatic pick",
};

/**
 * One model call that failed: its number, when it came after the first
 * call, which model and its HTTP status, then what the provider said and
 * how long the model rested after it.
 */
export default function MessageDetailsFailureRow({ failure, index, first_at }: Props) {
    const at = failure.created_at - first_at;
    const offset = at > 0 ? `+${formatDuration({ ms: at })}` : "start";
    const model = failure.model_name || failure.model_slug || "Unknown model";
    const provider = providerLabel({ name: failure.provider_name, kind: failure.provider_kind });
    const rested =
        failure.rests_until && failure.rests_until > failure.created_at
            ? ` Rested ${formatDuration({ ms: failure.rests_until - failure.created_at })}.`
            : "";

    return (
        <Stack className="w-full py-1.5 gap-0.5! items-stretch border-0 border-b border-solid border-hairline last:border-b-0">
            <Row className="w-full gap-3! flex-nowrap items-baseline">
                <Span className="w-8 shrink-0 text-[11px] leading-4 text-ink-secondary tabular-nums">{`#${index + 1}`}</Span>
                <Span className="w-14 shrink-0 text-[11px] leading-4 text-ink-secondary tabular-nums">{offset}</Span>
                <Span
                    className="grow min-w-0 text-[12px] leading-4 text-ink truncate"
                    title={[
                        `${model}${failure.model_slug ? ` (${failure.model_slug})` : ""} on ${provider}`,
                        `${harnessLabel({ harness: failure.harness })}${failure.source ? `, ${SourceLabels[failure.source]}` : ""}`,
                    ].join("\n")}
                >
                    {model}
                </Span>
                <Span className="shrink-0 text-[12px] leading-4 text-ink-secondary tabular-nums">
                    {failure.status ? `HTTP ${failure.status}` : "No response"}
                </Span>
            </Row>
            <Span className="pl-28 text-[12px] leading-4 text-ink-secondary break-words">
                {`${failure.error}${rested}`}
            </Span>
        </Stack>
    );
}

import Row from "@moduletrace/twui/layout/Row";
import Span from "@moduletrace/twui/layout/Span";
import type { MessageDetailsCall } from "@/src/types";
import describeCallSettings from "@/src/utils/describe-call-settings";
import formatDuration from "@/src/utils/format-duration";
import formatTokens from "@/src/utils/format-tokens";
import costLabel from "../(utils)/cost-label";
import harnessLabel from "../(utils)/harness-label";

type Props = {
    call: MessageDetailsCall;
    index: number;
    /**
     * When the first call was made, so each one reads as an offset from it.
     */
    first_at: number;
};

/**
 * One model call in the order it was made: its number, when it came after
 * the first, which model and what for, and its tokens and cost. A model
 * that answered after others failed is marked; the hover lists the
 * call's settings.
 */
export default function MessageDetailsCallRow({ call, index, first_at }: Props) {
    const offset = index ? `+${formatDuration({ ms: call.created_at - first_at })}` : "start";
    const model = call.model_name || call.model_slug || "Unknown model";
    const settings = call.settings
        ? describeCallSettings({ settings: call.settings, harness: call.harness })
              .map(({ label, value }) => `${label}: ${value}`)
              .join("\n")
        : "";
    const fell_back = Boolean(call.settings?.fell_back_from?.length);

    return (
        <Row className="w-full py-1.5 gap-3! flex-nowrap items-baseline border-0 border-b border-solid border-hairline last:border-b-0">
            <Span className="w-8 shrink-0 text-[11px] leading-4 text-ink-secondary tabular-nums">{`#${index + 1}`}</Span>
            <Span className="w-14 shrink-0 text-[11px] leading-4 text-ink-secondary tabular-nums">{offset}</Span>
            <Span
                className="grow min-w-0 text-[12px] leading-4 text-ink truncate"
                title={[
                    `${model}${call.model_slug ? ` (${call.model_slug})` : ""}, ${harnessLabel({ harness: call.harness })}`,
                    settings,
                ]
                    .filter(Boolean)
                    .join("\n")}
            >
                {fell_back ? `${model} (fallback)` : model}
            </Span>
            <Span
                className="shrink-0 text-[12px] leading-4 text-ink-secondary tabular-nums"
                title={`${call.prompt_tokens.toLocaleString()} in, ${call.completion_tokens.toLocaleString()} out · ${costLabel({ cost: call.cost })}`}
            >
                {`${formatTokens({ tokens: call.prompt_tokens })} / ${formatTokens({ tokens: call.completion_tokens })}`}
            </Span>
        </Row>
    );
}

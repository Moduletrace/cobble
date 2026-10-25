import Row from "@moduletrace/twui/layout/Row";
import Span from "@moduletrace/twui/layout/Span";
import Stack from "@moduletrace/twui/layout/Stack";
import type { MessageDetailsModel } from "@/src/types";
import describeCallSettings from "@/src/utils/describe-call-settings";
import formatTokens from "@/src/utils/format-tokens";
import costLabel from "../(utils)/cost-label";
import harnessLabel from "../(utils)/harness-label";
import providerLabel from "../(utils)/provider-label";
import MessageDetailsSetting from "./message-details-setting";

type Props = {
    model: MessageDetailsModel;
};

/**
 * One model a message used, summed over its calls: the model by name with
 * its exact id under it, the provider that served it and what it was used
 * for, then its calls, tokens and cost, and the settings it was called
 * with (temperature, reasoning effort, whose settings they were, any
 * fallback). Calls recorded before settings were show none.
 */
export default function MessageDetailsModelRow({ model }: Props) {
    const name = model.model_name || model.model_slug || "Unknown model";
    const settings = model.settings ? describeCallSettings({ settings: model.settings, harness: model.harness }) : [];

    return (
        <Stack className="w-full py-2.5 gap-1! items-stretch border-0 border-b border-solid border-hairline last:border-b-0">
            <Row className="w-full gap-3! flex-nowrap items-baseline">
                <Span className="grow min-w-0 text-[13px] leading-5 font-bold text-ink truncate" title={name}>
                    {name}
                </Span>
                <Span className="shrink-0 text-[13px] leading-5 text-ink tabular-nums">
                    {`${formatTokens({ tokens: model.total_tokens })} tokens`}
                </Span>
            </Row>
            {model.model_slug && model.model_slug != name ? (
                <Span className="text-[12px] leading-4 text-ink-secondary font-mono break-all">
                    {model.model_slug}
                </Span>
            ) : null}
            <Span className="text-[12px] leading-4 text-ink-secondary">
                {[
                    providerLabel({ name: model.provider_name, kind: model.provider_kind }),
                    harnessLabel({ harness: model.harness }),
                    `${model.calls} ${model.calls == 1 ? "call" : "calls"}`,
                    `${model.prompt_tokens.toLocaleString()} in, ${model.completion_tokens.toLocaleString()} out`,
                    costLabel({ cost: model.cost }),
                ].join(" · ")}
            </Span>
            {settings.length ? (
                <Row className="w-full mt-0.5 gap-x-3! gap-y-1! flex-wrap items-baseline">
                    {settings.map((setting) => (
                        <MessageDetailsSetting key={setting.label} {...setting} />
                    ))}
                </Row>
            ) : null}
        </Stack>
    );
}

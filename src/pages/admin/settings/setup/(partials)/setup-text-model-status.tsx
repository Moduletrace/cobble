import Row from "@moduletrace/twui/layout/Row";
import Span from "@moduletrace/twui/layout/Span";
import { CircleCheck, CircleAlert } from "lucide-react";
import type { HarnessOverview } from "@/src/types";

type Props = {
    text?: HarnessOverview;
};

/**
 * Whether the bots have a model to think with yet, and which.
 */
export default function SetupTextModelStatus({ text }: Props) {
    const current = text?.current;

    return (
        <Row className="w-full gap-2! flex-nowrap items-start rounded-default border border-solid border-hairline bg-surface px-4 py-3">
            {current ? (
                <CircleCheck size={16} aria-hidden className="shrink-0 mt-0.5" />
            ) : (
                <CircleAlert size={16} aria-hidden className="shrink-0 mt-0.5" />
            )}
            <Span className="text-[13px] leading-5 text-ink">
                {current
                    ? `Your bots think with ${current.name || current.slug} on ${current.provider_name}.`
                    : "Your bots have no model to think with yet. Add a key to a provider (OpenRouter has free models) or add another provider."}
            </Span>
        </Row>
    );
}

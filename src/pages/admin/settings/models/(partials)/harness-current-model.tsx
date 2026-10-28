import Span from "@moduletrace/twui/layout/Span";
import { harnessFallbackTitle } from "@/src/dict/harness-dict";
import type { HarnessOverview } from "@/src/types";

type Props = {
    harness: HarnessOverview;
};

/**
 * What the harness runs on right now, as saved, in one line.
 */
export default function HarnessCurrentModel({ harness }: Props) {
    const falls_back_title = harnessFallbackTitle({ harness: harness.harness });
    const text = !harness.enabled
        ? falls_back_title
            ? `Turned off: ${falls_back_title.toLowerCase()} does it.`
            : "Turned off."
        : harness.current
          ? `Now using ${harness.current.name} on ${harness.current.provider_name}${
                harness.current.source == "auto" ? ", picked automatically" : ""
            }.${
                harness.candidate_count > 1
                    ? ` ${harness.candidate_count - 1} more to fall back on.`
                    : ""
            }`
          : harness.required
            ? "Nothing to run on yet: no provider has a usable key."
            : falls_back_title && !harness.model_id
              ? `${falls_back_title} does it until a model is picked.`
              : !harness.automatic
              ? "Not available until a model is picked."
              : "No free model can do this right now. Pick one to turn it on.";

    return (
        <Span className="text-[13px] leading-[18px] text-ink-secondary">
            {text}
        </Span>
    );
}

import Span from "@moduletrace/twui/layout/Span";
import type { HarnessOverview } from "@/src/types";

type Props = {
    harness: HarnessOverview;
};

/**
 * What the harness runs on right now, as saved, in one line.
 */
export default function HarnessCurrentModel({ harness }: Props) {
    const text = !harness.enabled
        ? "Turned off."
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
            : !harness.automatic
              ? "Not available until a model is picked."
              : "No free model can do this right now. Pick one to turn it on.";

    return (
        <Span className="text-[13px] leading-[18px] text-ink-secondary">
            {text}
        </Span>
    );
}

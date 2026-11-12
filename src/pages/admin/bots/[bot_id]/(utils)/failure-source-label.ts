import type { MessageDetailsFailure } from "@/src/types";

const SourceLabels: Record<NonNullable<MessageDetailsFailure["source"]>, string> = {
    pinned: "the pick",
    fallback: "a fallback model",
    auto: "an automatic pick",
};

type Params = {
    source: MessageDetailsFailure["source"];
};

/**
 * How a failed call's model was picked, in words: "the pick", "a fallback
 * model", "an automatic pick". Empty when the call recorded no source.
 */
export default function failureSourceLabel({ source }: Params) {
    return source ? SourceLabels[source] : "";
}

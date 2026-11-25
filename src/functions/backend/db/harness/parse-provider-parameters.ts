import {
    HarnessParameterKeys,
    type HarnessParameterKey,
} from "@/src/dict/harness-parameter-dict";

type Params = {
    text?: string | null;
};

/**
 * The generation settings a provider row saved, or undefined when it saved
 * none (which follows its preset or host instead). Unknown keys are dropped,
 * so an older release's name can't reach a model's `supported_parameters`
 * and be offered as a field that never gets sent.
 */
export default function parseProviderParameters({
    text,
}: Params): HarnessParameterKey[] | undefined {
    if (!text) return undefined;

    try {
        const value = JSON.parse(text);

        if (!Array.isArray(value)) return undefined;

        return value.filter((key): key is HarnessParameterKey =>
            HarnessParameterKeys.includes(key as HarnessParameterKey),
        );
    } catch {
        return undefined;
    }
}
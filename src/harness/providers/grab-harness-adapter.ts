import type { HarnessProviderKind } from "@/src/dict/harness-provider-dict";
import type { HarnessAdapter } from "../types";
import OpenAICompatibleAdapter from "./openai-compatible";

type Params = {
    kind: HarnessProviderKind;
};

/**
 * The adapter for a provider kind. Every kind speaks the OpenAI-compatible
 * API today; a provider that gets a native adapter returns it here.
 */
export default function grabHarnessAdapter({ kind }: Params): HarnessAdapter {
    switch (kind) {
        default:
            return OpenAICompatibleAdapter;
    }
}

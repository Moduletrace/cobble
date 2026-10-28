import type { z } from "zod";
import type { HarnessKind } from "@/src/dict/harness-dict";
import type { HarnessProviderKind } from "@/src/dict/harness-provider-dict";

/**
 * Part of a user message. Images are an https or `data:` URL; audio is
 * base64 with its format (`mp3`, `wav`, `webm`, `m4a`, ...).
 */
export type HarnessContentPart =
    | { type: "text"; text: string }
    | { type: "image"; url: string; name?: string }
    | { type: "audio"; data: string; format: string; name?: string };

export type HarnessToolCall = {
    id: string;
    name: string;
    /**
     * JSON text, exactly as the model wrote it.
     */
    arguments: string;
};

/**
 * One tool call a run made, and whether it went through (a result that
 * isn't `Error: ...`). Names only, never arguments.
 */
export type HarnessToolUse = {
    name: string;
    ok: boolean;
};

export type HarnessMessage =
    | { role: "system"; content: string }
    | { role: "user"; content: string | HarnessContentPart[] }
    | {
          role: "assistant";
          content: string | null;
          tool_calls?: HarnessToolCall[];
      }
    | { role: "tool"; tool_call_id: string; content: string };

/**
 * What the model sees of a tool.
 */
export type HarnessToolDefinition = {
    name: string;
    description: string;
    /**
     * JSON schema of the arguments object.
     */
    parameters: Record<string, unknown>;
};

/**
 * A tool the text harness can call. Tools are built per run with whatever
 * they act on (bot, user, computer) already bound, so `run` only gets the
 * arguments. Return text for the model; throw to report a failure to it.
 *
 * Own tools describe their arguments with a zod `schema`, checked before
 * `run`. Tools described elsewhere (an MCP server) pass its JSON schema as
 * `parameters` instead and check their own arguments.
 */
export type HarnessTool<Args = any> = {
    name: string;
    description: string;
    schema?: z.ZodType<Args>;
    parameters?: Record<string, unknown>;
    run: (params: { args: Args; signal: AbortSignal }) => Promise<string>;
};

/**
 * A provider as the adapters need it: where to call and with which key.
 */
export type HarnessProviderConfig = {
    id?: number;
    kind: HarnessProviderKind;
    name?: string;
    base_url: string;
    api_key?: string;
};

/**
 * What the harness knows about a model, from the catalog.
 */
export type HarnessModelInfo = {
    slug: string;
    name?: string;
    input_modalities: string[];
    output_modalities: string[];
    supports_tools: boolean;
    context_length?: number;
    max_output_tokens?: number;
    voices?: string[];
    /**
     * The request fields the provider says it takes (OpenRouter's
     * `supported_parameters`). Undefined when the provider doesn't say:
     * then every generation setting is sent.
     */
    supported_parameters?: string[];
};

/**
 * A catalog entry as a provider lists it.
 */
export type HarnessCatalogModel = HarnessModelInfo & {
    free: boolean;
    /**
     * Unix ms.
     */
    released_at?: number;
    /**
     * Unix ms. The provider retires the model then.
     */
    expires_at?: number;
    /**
     * Artificial Analysis intelligence index, when the provider shares it.
     */
    intelligence_score?: number;
    /**
     * Artificial Analysis agentic index (tool use, multi-step work).
     */
    agentic_score?: number;
};

/**
 * One provider + model a harness can call, in the order they are tried.
 */
export type HarnessCandidate = {
    /**
     * `<provider id>:<slug>`. Identifies the candidate for cooldowns.
     */
    key: string;
    provider: HarnessProviderConfig;
    model: HarnessModelInfo;
    /**
     * `pinned`: the super admin's pick. `auto`: an automatic free pick.
     */
    source: "pinned" | "auto";
};

export type HarnessUsage = {
    prompt_tokens?: number;
    completion_tokens?: number;
    /**
     * In the provider's currency (USD for OpenRouter), when reported.
     */
    cost?: number;
};

/**
 * What a harness does with a model, for its usage rows and the totals
 * that read them. Mirrors the `harness` column of `token_usages`.
 */
export type HarnessUsageKind =
    | "text"
    | "vision"
    | "transcription"
    | "speech"
    | "image"
    | "image_edit"
    | "embedding";

export type HarnessChatParams = {
    candidate: HarnessCandidate;
    messages: HarnessMessage[];
    tools?: HarnessToolDefinition[];
    max_tokens?: number;
    /**
     * Sampling and reasoning fields, keyed by their wire name. The caller
     * only includes what the model advertises.
     */
    params?: Record<string, number | string | { effort: string }>;
    signal: AbortSignal;
};

export type HarnessChatResult = {
    text: string | null;
    tool_calls: HarnessToolCall[];
    finish_reason?: string;
    usage?: HarnessUsage;
};

export type HarnessAudioInput = {
    data: Uint8Array;
    /**
     * `mp3`, `wav`, `webm`, `m4a`, `ogg`, `flac`.
     */
    format: string;
};

export type HarnessTranscribeParams = {
    candidate: HarnessCandidate;
    audio: HarnessAudioInput;
    language?: string;
    signal: AbortSignal;
};

export type HarnessSpeakParams = {
    candidate: HarnessCandidate;
    text: string;
    voice?: string;
    /**
     * `mp3` unless set.
     */
    format?: string;
    signal: AbortSignal;
};

/**
 * Speech as the provider sends it: the stream starts once the provider
 * answers, so it can play while the rest is still being made.
 */
export type HarnessAudioStream = {
    stream: ReadableStream<Uint8Array>;
    media_type: string;
};

export type HarnessImageParams = {
    candidate: HarnessCandidate;
    prompt: string;
    n?: number;
    /**
     * e.g. `1024x1024`, when the model takes one.
     */
    size?: string;
    /**
     * Reference images: https or `data:` URLs.
     */
    references?: string[];
    signal: AbortSignal;
};

export type HarnessImageOutput = {
    data: Uint8Array;
    media_type: string;
};

export type HarnessEmbedParams = {
    candidate: HarnessCandidate;
    /**
     * The texts to embed, in order. Their vectors come back in the same
     * order, at whatever width the model produces (the caller fits them
     * to `AppData.EmbeddingDimensions`).
     */
    input: string[];
    signal: AbortSignal;
};

export type HarnessEmbedResult = {
    vectors: number[][];
    /**
     * The provider's usage, when it reports it.
     */
    usage?: HarnessUsage;
};

/**
 * How the harness talks to one kind of provider. Every call takes the
 * candidate it runs on and an abort signal.
 */
export type HarnessAdapter = {
    chat: (params: HarnessChatParams) => Promise<HarnessChatResult>;
    /**
     * `usage` when the provider says how many tokens it heard, which
     * OpenAI-style speech-to-text endpoints do only sometimes.
     */
    transcribe: (params: HarnessTranscribeParams) => Promise<{
        text: string;
        usage?: HarnessUsage;
    }>;
    speak: (params: HarnessSpeakParams) => Promise<HarnessAudioStream>;
    /**
     * Image models report what they made rather than how many tokens it
     * took, so `usage` is only whatever the provider volunteers.
     */
    generateImage: (
        params: HarnessImageParams,
    ) => Promise<{ images: HarnessImageOutput[]; usage?: HarnessUsage }>;
    embed: (params: HarnessEmbedParams) => Promise<HarnessEmbedResult>;
    listModels: (params: {
        provider: HarnessProviderConfig;
        signal?: AbortSignal;
    }) => Promise<HarnessCatalogModel[]>;
};

export type { HarnessKind };

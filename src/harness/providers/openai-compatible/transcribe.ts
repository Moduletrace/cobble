import HarnessError from "../../harness-error";
import type { HarnessAdapter } from "../../types";
import { isDashScopeHost } from "./dashscope-hosts";
import transcribeNative from "./dashscope-native-transcribe";
import providerRequest from "./provider-request";

/**
 * The native Qwen-ASR models: the only synchronous speech models Alibaba's
 * DashScope/Model Studio hosts serve, at their own route rather than
 * `/audio/transcriptions`.
 */
const NativeAsrModel = /asr|paraformer/i;
/**
 * File transcription is a job at the provider (submit, then poll), which
 * this adapter doesn't run: it would queue a task and wait for nothing.
 */
const AsyncOnlyAsrModel = /filetrans|paraformer/i;

/**
 * `POST /audio/transcriptions` as an OpenAI-style file upload, which
 * OpenRouter, OpenAI, Groq and local servers all take. Alibaba's hosts have
 * no such route, so their ASR models go to the native call instead.
 */
const transcribe: HarnessAdapter["transcribe"] = async ({
    candidate,
    audio,
    language,
    signal,
}) => {
    if (isDashScopeHost({ base_url: candidate.provider.base_url }) && NativeAsrModel.test(candidate.model.slug)) {
        if (AsyncOnlyAsrModel.test(candidate.model.slug)) {
            throw new HarnessError({
                message: `${candidate.provider.name || "Alibaba Cloud"}: ${candidate.model.slug} only transcribes as an asynchronous job, which this harness doesn't run. Pick a synchronous ASR model such as qwen-audio-3.0-asr-flash.`,
                retryable: false,
                candidate_key: candidate.key,
            });
        }

        return await transcribeNative({ candidate, audio, language, signal });
    }

    const form = new FormData();

    form.append("model", candidate.model.slug);
    form.append(
        "file",
        new Blob([new Uint8Array(audio.data)], {
            type: `audio/${audio.format}`,
        }),
        `audio.${audio.format}`,
    );

    if (language) {
        form.append("language", language);
    }

    const res = await providerRequest({
        provider: candidate.provider,
        path: "/audio/transcriptions",
        form,
        signal,
        candidate_key: candidate.key,
    });

    const json = await res.json().catch(() => null);

    /**
     * A cut-off or malformed answer is a failed call, not silence: saying
     * it failed lets the harness try the next model instead of handing the
     * user an empty transcript.
     */
    if (json === null) {
        throw new HarnessError({
            message: `${candidate.provider.name || "The provider"} returned an unreadable transcript.`,
            retryable: true,
            candidate_key: candidate.key,
        });
    }

    /**
     * Providers that bill by audio seconds sometimes report a token count;
     * the OpenAI shape puts it under `usage`. Left out when absent, so the
     * row records that the call happened without a token count.
     */
    const usage =
        json?.usage && typeof json.usage == "object"
            ? {
                  prompt_tokens: Number(json.usage.prompt_tokens ?? json.usage.input_tokens) || 0,
                  completion_tokens:
                      Number(json.usage.completion_tokens ?? json.usage.output_tokens) || 0,
                  ...(typeof json.usage.cost == "number" ? { cost: json.usage.cost } : {}),
              }
            : undefined;

    const text = String(json?.text || "").trim();

    /**
     * An empty transcript is a failed call, not silence: caching "" would
     * hand every later reply an empty reading of the clip. Saying it
     * failed lets the harness try the next model (L8).
     */
    if (!text) {
        throw new HarnessError({
            message: `${candidate.provider.name || "The provider"} returned an empty transcript.`,
            retryable: true,
            candidate_key: candidate.key,
        });
    }

    return { text, ...(usage ? { usage } : {}) };
};

export default transcribe;

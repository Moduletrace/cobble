import { AppData } from "@/src/data/app-data";
import HarnessError from "../../harness-error";
import type { HarnessCandidate, HarnessImageOutput } from "../../types";
import downloadProviderFile from "./download-provider-file";
import providerRequest from "./provider-request";

type Params = {
    candidate: HarnessCandidate;
    prompt: string;
    n?: number;
    size?: string;
    references?: string[];
    signal: AbortSignal;
};

/**
 * Alibaba's native image call. The Model Studio hosts answer it on the host
 * root, not under the provider's `/compatible-mode/v1` base, and a host can
 * serve it while having no OpenAI-compatible `/images/generations` at all:
 * the Token Plan host answers that path 404 with an empty body, so a valid
 * `qwen-image-3.0-pro` pick could never make a picture.
 *
 * References and the prompt are content parts of one `user` message, which is
 * how the native API takes image editing too. The answer carries image URLs,
 * downloaded here under the same guards as every other provider URL.
 */
export const NativeImagePath = "/api/v1/services/aigc/multimodal-generation/generation";

export default async function generateImageNative({
    candidate,
    prompt,
    n,
    size,
    references = [],
    signal,
}: Params): Promise<{ images: HarnessImageOutput[] }> {
    const { provider, model } = candidate;
    const name = provider.name || "Alibaba Cloud";
    const native_size = nativeSize({ size });

    const res = await providerRequest({
        provider,
        base_url: nativeOrigin({ base_url: provider.base_url }),
        path: NativeImagePath,
        json: {
            model: model.slug,
            input: {
                messages: [
                    {
                        role: "user",
                        content: [
                            { text: prompt },
                            ...references.map((url) => ({ image: url })),
                        ],
                    },
                ],
            },
            /**
             * Only the fields Token Plan's own sample sends. `prompt_extend`
             * is their default already, and sending it (with the thinking
             * pass it turns on) is what closed the socket before any status
             * on the Token Plan host.
             */
            parameters: {
                ...(n ? { n } : {}),
                ...(native_size ? { size: native_size } : {}),
                watermark: false,
            },
        },
        signal,
        candidate_key: candidate.key,
    });

    const json = await res.json().catch(() => null);

    /**
     * The native API also has an asynchronous task form. This path is the
     * synchronous one; a task id here means the provider answered with the
     * other shape, and waiting on it is not this adapter's job.
     */
    if (json?.output?.task_id) {
        throw new HarnessError({
            message: `${name}: the native image API queued a task (${json.output.task_id}) instead of answering; its async form isn't supported.`,
            retryable: false,
            candidate_key: candidate.key,
        });
    }

    const urls = imageUrls({ json });

    if (!urls.length) {
        throw new HarnessError({
            message: `${name}: no image came back from ${NativeImagePath}.`,
            retryable: true,
            candidate_key: candidate.key,
        });
    }

    const images: HarnessImageOutput[] = [];

    for (const url of urls) {
        const { data, media_type } = await downloadProviderFile({
            url,
            max_bytes: AppData.HarnessImageDownloadMaxBytes,
            signal,
            label: name,
        });

        images.push({ data, media_type });
    }

    return { images };
}

/**
 * The host root: the native routes live beside `<base>/compatible-mode/v1`,
 * never under it.
 */
function nativeOrigin({ base_url }: { base_url: string }) {
    try {
        return new URL(base_url).origin;
    } catch {
        throw new HarnessError({
            message: `The provider's base URL can't be read as an address: ${base_url}`,
            retryable: false,
        });
    }
}

/**
 * The tool's size is a plain `1024x1024`; the native API wants
 * `1024*1024` and ignores anything that isn't a pair of pixels.
 */
function nativeSize({ size }: { size?: string }) {
    if (!size) return undefined;

    const pair = size.trim().match(/^(\d+)\s*[x*]\s*(\d+)$/i);

    return pair ? `${pair[1]}*${pair[2]}` : undefined;
}

/**
 * Every image URL the native answer carries: the multimodal answer lists them
 * as `output.choices[].message.content[].image`, and some models answer with
 * `output.results[].url`.
 */
function imageUrls({ json }: { json: any }): string[] {
    const urls: unknown[] = [];

    for (const choice of Array.isArray(json?.output?.choices) ? json.output.choices : []) {
        for (const part of Array.isArray(choice?.message?.content) ? choice.message.content : []) {
            urls.push(part?.image);
        }
    }

    for (const result of Array.isArray(json?.output?.results) ? json.output.results : []) {
        urls.push(result?.url);
    }

    return urls.filter((url): url is string => typeof url == "string" && url.length > 0);
}
import { AppData } from "@/src/data/app-data";
import HarnessError from "../../harness-error";
import type { HarnessAdapter, HarnessCandidate, HarnessImageOutput } from "../../types";
import grabProviderPreset from "../grab-provider-preset";
import downloadProviderFile from "./download-provider-file";
import generateImageNative from "./dashscope-native-image";
import imageRequestFields from "./image-request-fields";
import providerRequest from "./provider-request";
import referenceBlob from "./reference-blob";

/**
 * Image generation at the provider's `image_path` (`/images` on
 * OpenRouter, `/images/generations` elsewhere). With reference images,
 * OpenRouter takes them on the same call (`input_references`); Alibaba's
 * DashScope/Model Studio hosts take them as the `image` extension field on
 * that same generations call; the others get them as a multipart upload at
 * `image_edit_path` (`/images/edits`). Images come back as base64, or as
 * URLs that are downloaded here (DashScope only ever returns URLs).
 *
 * The Token Plan host (`token-plan.*.maas.aliyuncs.com`) has no compatible
 * images route. Its image models are served by Alibaba's native
 * `multimodal-generation` call at the host root, so that call goes there
 * directly. A workspace Model Studio host that answers 404 or 405 on the
 * compatible route falls back to the same native call.
 */
const generateImage: HarnessAdapter["generateImage"] = async ({
    candidate,
    prompt,
    n,
    size,
    references,
    signal,
}) => {
    const { provider } = candidate;
    const preset = grabProviderPreset({ kind: provider.kind });

    if (isTokenPlanHost({ base_url: provider.base_url })) {
        return await generateImageNative({ candidate, prompt, n, size, references, signal });
    }

    let res: Response;

    try {
        res = await requestCompatibleImage({ candidate, prompt, n, size, references, signal });
    } catch (error: unknown) {
        /**
         * A workspace Model Studio host that answers 404 or 405 on the
         * compatible images route has no route there, so the model pick is
         * fine and the native call is where the picture comes from.
         */
        const missing_route =
            error instanceof HarnessError && (error.status == 404 || error.status == 405);

        if (!missing_route || !isDashScopeHost({ base_url: provider.base_url })) throw error;

        return await generateImageNative({ candidate, prompt, n, size, references, signal });
    }

    const json = await res.json().catch(() => null);
    const items: any[] = Array.isArray(json?.data) ? json.data : [];
    const images: HarnessImageOutput[] = [];

    for (const item of items) {
        if (typeof item?.b64_json == "string") {
            images.push({
                data: Uint8Array.from(Buffer.from(item.b64_json, "base64")),
                media_type: item.media_type || "image/png",
            });
        } else if (typeof item?.url == "string") {
            const { data, media_type } = await downloadProviderFile({
                url: item.url,
                max_bytes: AppData.HarnessImageDownloadMaxBytes,
                signal,
                label: provider.name || preset.title,
            });

            images.push({ data, media_type });
        }
    }

    if (!images.length) {
        throw new HarnessError({
            message: `${provider.name || preset.title}: No image came back.`,
            retryable: true,
            candidate_key: candidate.key,
        });
    }

    /**
     * Image models bill per image, not per token: only a provider that
     * volunteers a usage figure is recorded with one.
     */
    const usage =
        json?.usage && typeof json.usage == "object"
            ? {
                  prompt_tokens: Number(json.usage.prompt_tokens) || 0,
                  completion_tokens: Number(json.usage.completion_tokens) || 0,
                  ...(typeof json.usage.cost == "number" ? { cost: json.usage.cost } : {}),
              }
            : undefined;

    return { images, ...(usage ? { usage } : {}) };
};

export default generateImage;

type CompatibleRequestParams = {
    candidate: HarnessCandidate;
    prompt: string;
    n?: number;
    size?: string;
    references?: string[];
    signal: AbortSignal;
};

/**
 * The OpenAI-compatible call: a multipart edit when the provider takes
 * references that way, otherwise one JSON generations call.
 */
async function requestCompatibleImage({
    candidate,
    prompt,
    n,
    size,
    references,
    signal,
}: CompatibleRequestParams) {
    const { provider, model } = candidate;
    const preset = grabProviderPreset({ kind: provider.kind });
    const is_openrouter = provider.kind == "openrouter";
    const dashscope = isDashScopeHost({ base_url: provider.base_url });
    const edits = Boolean(references?.length) && !is_openrouter && !dashscope;
    const fields = imageRequestFields({ provider_kind: provider.kind, size });

    if (edits) {
        return await providerRequest({
            provider,
            path: preset.image_edit_path,
            form: await editForm({
                model: model.slug,
                prompt,
                n,
                size,
                references: references || [],
                signal,
            }),
            signal,
            candidate_key: candidate.key,
        });
    }

    return await providerRequest({
        provider,
        path: preset.image_path,
        json: {
            model: model.slug,
            prompt,
            ...(n ? { n } : {}),
            ...fields,
            ...(is_openrouter && references?.length
                ? {
                      input_references: references.map((url) => ({
                          type: "image_url",
                          image_url: { url },
                      })),
                  }
                : {}),
            // DashScope/Model Studio takes references as the `image`
            // extension field (`data:` URLs or public URLs) on the
            // generations call, never as a multipart /images/edits
            // upload.
            ...(dashscope && references?.length ? { image: references } : {}),
            // Ask for base64 on every provider, OpenRouter included: a
            // URL handed back is one more fetch to guard (H4), and the
            // bytes inline avoid it altogether. DashScope ignores this
            // and returns URLs, which are downloaded below.
            response_format: "b64_json",
        },
        signal,
        candidate_key: candidate.key,
    });
}

type EditFormParams = {
    model: string;
    prompt: string;
    n?: number;
    size?: string;
    references: string[];
    signal: AbortSignal;
};

/**
 * The `/images/edits` upload: the prompt and every reference image as a
 * file (`image[]` when there are several, as gpt-image takes them).
 */
async function editForm({ model, prompt, n, size, references, signal }: EditFormParams) {
    const form = new FormData();

    form.append("model", model);
    form.append("prompt", prompt);
    if (n) form.append("n", String(n));
    if (size) form.append("size", size);

    const field = references.length > 1 ? "image[]" : "image";

    for (let index = 0; index < references.length; index++) {
        const { blob, ext } = await referenceBlob({ url: references[index]!, signal });

        form.append(field, blob, `reference-${index + 1}.${ext}`);
    }

    return form;
}

/**
 * Alibaba's DashScope and Model Studio (`maas`) hosts serve the OpenAI
 * images protocol with their own quirks: references go in the `image`
 * extension field on `/images/generations` (no multipart `/images/edits`),
 * and the response is always URLs. The shared `dashscope` hosts and the
 * workspace `maas` hosts both count; a custom provider pointed elsewhere
 * keeps the standard behaviour.
 */
/**
 * Alibaba's Token Plan host. Its image models are served only by the native
 * call; the compatible `/images/generations` path 404s, and trying it first
 * benches the model before the picture is made.
 */
export function isTokenPlanHost({ base_url }: { base_url?: string | null }) {
    if (!base_url) return false;

    try {
        return new URL(base_url).hostname.startsWith("token-plan.");
    } catch {
        return false;
    }
}

function isDashScopeHost({ base_url }: { base_url?: string | null }) {
    if (!base_url) return false;

    try {
        const host = new URL(base_url).hostname;

        return (
            host == "dashscope.aliyuncs.com" ||
            host == "dashscope-intl.aliyuncs.com" ||
            host.endsWith(".maas.aliyuncs.com")
        );
    } catch {
        return false;
    }
}

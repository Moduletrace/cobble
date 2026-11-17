import { AppData } from "@/src/data/app-data";
import HarnessError from "../../harness-error";
import type { HarnessAdapter, HarnessImageOutput } from "../../types";
import grabProviderPreset from "../grab-provider-preset";
import downloadProviderFile from "./download-provider-file";
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
 */
const generateImage: HarnessAdapter["generateImage"] = async ({
    candidate,
    prompt,
    n,
    size,
    references,
    signal,
}) => {
    const { provider, model } = candidate;
    const preset = grabProviderPreset({ kind: provider.kind });
    const is_openrouter = provider.kind == "openrouter";
    const dashscope = isDashScopeHost({ base_url: provider.base_url });
    const edits = Boolean(references?.length) && !is_openrouter && !dashscope;

    const res = edits
        ? await providerRequest({
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
          })
        : await providerRequest({
              provider,
              path: preset.image_path,
              json: {
                  model: model.slug,
                  prompt,
                  ...(n ? { n } : {}),
                  ...(size ? { size } : {}),
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

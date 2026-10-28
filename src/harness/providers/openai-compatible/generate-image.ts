import { AppData } from "@/src/data/app-data";
import bufferFromBase64 from "@/src/utils/buffer-from-base-64";
import HarnessError from "../../harness-error";
import type { HarnessAdapter, HarnessImageOutput } from "../../types";
import grabProviderPreset from "../grab-provider-preset";
import providerRequest from "./provider-request";

/**
 * Image generation at the provider's `image_path` (`/images` on
 * OpenRouter, `/images/generations` elsewhere). With reference images,
 * OpenRouter takes them on the same call (`input_references`); the others
 * get them as a multipart upload at `image_edit_path` (`/images/edits`).
 * Images come back as base64, or as URLs that are downloaded here.
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
    const edits = Boolean(references?.length) && !is_openrouter;

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
                  ...(is_openrouter
                      ? references?.length
                          ? {
                                input_references: references.map((url) => ({
                                    type: "image_url",
                                    image_url: { url },
                                })),
                            }
                          : {}
                      : { response_format: "b64_json" }),
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
            const download = await fetch(item.url, {
                signal: AbortSignal.any([
                    signal,
                    AbortSignal.timeout(AppData.HarnessRequestTimeoutMs),
                ]),
            });

            if (download.ok) {
                images.push({
                    data: new Uint8Array(await download.arrayBuffer()),
                    media_type:
                        download.headers.get("content-type")?.split(";")[0] ||
                        "image/png",
                });
            }
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
 * A reference's bytes: decoded from a `data:` URL, downloaded otherwise.
 */
async function referenceBlob({ url, signal }: { url: string; signal: AbortSignal }) {
    if (url.startsWith("data:")) {
        const { buffer, ext } = await bufferFromBase64(url);
        const type = url.slice(5, url.indexOf(";")) || "image/png";

        return { blob: new Blob([new Uint8Array(buffer)], { type }), ext };
    }

    const download = await fetch(url, {
        signal: AbortSignal.any([signal, AbortSignal.timeout(AppData.HarnessRequestTimeoutMs)]),
    });

    if (!download.ok) {
        throw new HarnessError({ message: `A reference image couldn't be downloaded.` });
    }

    const type = download.headers.get("content-type")?.split(";")[0] || "image/png";

    return { blob: new Blob([await download.arrayBuffer()], { type }), ext: type.split("/")[1] || "png" };
}

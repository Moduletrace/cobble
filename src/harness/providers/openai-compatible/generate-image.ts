import HarnessError from "../../harness-error";
import type { HarnessAdapter, HarnessImageOutput } from "../../types";
import grabProviderPreset from "../grab-provider-preset";
import providerRequest from "./provider-request";

/**
 * Image generation at the provider's `image_path` (`/images` on
 * OpenRouter, `/images/generations` elsewhere). Images come back as
 * base64, or as URLs that are downloaded here.
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

    const res = await providerRequest({
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
            const download = await fetch(item.url, { signal });

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

    return { images };
};

export default generateImage;

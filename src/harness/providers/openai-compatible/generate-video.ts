import { AppData } from "@/src/data/app-data";
import abortableSleep from "@/src/utils/abortable-sleep";
import HarnessError from "../../harness-error";
import type { HarnessAdapter, HarnessCandidate, HarnessVideoOutput } from "../../types";
import grabProviderPreset from "../grab-provider-preset";
import openAiVideoSize from "./open-ai-video-size";
import openRouterVideoBody from "./open-router-video-body";
import providerRequest from "./provider-request";
import readVideoJob, { type VideoJob } from "./read-video-job";
import referenceBlob from "./reference-blob";

/**
 * A video at the provider's `video_path`: the job is asked for, checked on
 * every `AppData.VideoPollIntervalMs` until it's done (for at most
 * `AppData.VideoMaxWaitMs`), then each video is downloaded from
 * `<video_path>/<id>/content`, always from the provider itself, so its key
 * never goes to another host. OpenRouter takes JSON with frames,
 * references and videos to change; the others get OpenAI's form (Sora):
 * the prompt, length, size and at most one image to start from.
 */
const generateVideo: HarnessAdapter["generateVideo"] = async ({
    candidate,
    prompt,
    duration,
    resolution,
    aspect_ratio,
    images,
    videos,
    audio,
    signal,
}) => {
    const { provider, model } = candidate;
    const preset = grabProviderPreset({ kind: provider.kind });
    const provider_name = provider.name || preset.title;
    const is_openrouter = provider.kind == "openrouter";

    if (!is_openrouter && videos?.length) {
        throw new HarnessError({
            message: `${provider_name} takes no videos to change here.`,
            candidate_key: candidate.key,
        });
    }

    const submit = is_openrouter
        ? await providerRequest({
              provider,
              path: preset.video_path,
              json: openRouterVideoBody({
                  model: model.slug,
                  prompt,
                  duration,
                  resolution,
                  aspect_ratio,
                  images,
                  videos,
                  audio,
              }),
              signal,
              candidate_key: candidate.key,
          })
        : await providerRequest({
              provider,
              path: preset.video_path,
              form: await openAiForm({
                  model: model.slug,
                  prompt,
                  duration,
                  size: openAiVideoSize({ resolution, aspect_ratio }),
                  image: (images?.find((image) => image.role == "first_frame") || images?.[0])?.url,
                  signal,
              }),
              signal,
              candidate_key: candidate.key,
          });

    const started = readVideoJob({ json: await submit.json().catch(() => null) });

    if (!started) {
        throw new HarnessError({
            message: `${provider_name}: The video job didn't start.`,
            retryable: true,
            candidate_key: candidate.key,
        });
    }

    const job = await waitForJob({ candidate, job: started, signal });
    const count = Math.min(job.outputs, 4);
    const videos_made: HarnessVideoOutput[] = [];

    for (let index = 0; index < count; index++) {
        const res = await providerRequest({
            provider,
            path: `${preset.video_path}/${encodeURIComponent(job.id)}/content${is_openrouter ? `?index=${index}` : ""}`,
            method: "GET",
            signal,
            candidate_key: candidate.key,
        });

        videos_made.push({
            data: new Uint8Array(await res.arrayBuffer()),
            media_type: res.headers.get("content-type")?.split(";")[0] || "video/mp4",
        });
    }

    if (!videos_made.some((video) => video.data.byteLength)) {
        throw new HarnessError({
            message: `${provider_name}: No video came back.`,
            candidate_key: candidate.key,
        });
    }

    return {
        videos: videos_made.filter((video) => video.data.byteLength),
        ...(typeof job.cost == "number" ? { usage: { cost: job.cost } } : {}),
    };
};

export default generateVideo;

type WaitParams = {
    candidate: HarnessCandidate;
    job: VideoJob;
    signal: AbortSignal;
};

/**
 * Checks on a job until it's done or failed. A check that fails on the way
 * (a timeout, a hiccup) doesn't end the wait: the job runs on at the
 * provider. A job still working at `AppData.VideoMaxWaitMs` fails without
 * benching the model (it may just be slow), and is left to the provider.
 */
async function waitForJob({ candidate, job, signal }: WaitParams): Promise<VideoJob> {
    const { provider } = candidate;
    const preset = grabProviderPreset({ kind: provider.kind });
    const provider_name = provider.name || preset.title;
    const deadline = Date.now() + AppData.VideoMaxWaitMs;
    let current = job;

    while (current.state == "working") {
        if (Date.now() >= deadline) {
            throw new HarnessError({
                message: `${provider_name}: The video still wasn't ready after ${Math.round(AppData.VideoMaxWaitMs / 60000)} minutes.`,
                candidate_key: candidate.key,
            });
        }

        await abortableSleep({ ms: AppData.VideoPollIntervalMs, signal }).catch(() => {
            throw new HarnessError({ message: `Cancelled.`, code: "aborted", candidate_key: candidate.key });
        });

        try {
            const res = await providerRequest({
                provider,
                path: `${preset.video_path}/${encodeURIComponent(current.id)}`,
                method: "GET",
                signal,
                timeout_ms: 30 * 1000,
                candidate_key: candidate.key,
            });

            current = readVideoJob({ json: await res.json().catch(() => null) }) || current;
        } catch (error: unknown) {
            if (error instanceof HarnessError && (error.code == "aborted" || !error.retryable)) {
                throw error;
            }
        }
    }

    if (current.state == "failed") {
        throw new HarnessError({
            message: `${provider_name}: ${current.error || "The video failed."}`.slice(0, 400),
            candidate_key: candidate.key,
        });
    }

    return current;
}

type FormParams = {
    model: string;
    prompt: string;
    duration?: number;
    size?: string;
    /**
     * The image to start from: an https or `data:` URL.
     */
    image?: string;
    signal: AbortSignal;
};

/**
 * OpenAI's video form: `seconds` and `size` as text, the image to start
 * from as `input_reference`.
 */
async function openAiForm({ model, prompt, duration, size, image, signal }: FormParams) {
    const form = new FormData();

    form.append("model", model);
    form.append("prompt", prompt);
    if (duration) form.append("seconds", String(duration));
    if (size) form.append("size", size);

    if (image) {
        const { blob, ext } = await referenceBlob({ url: image, signal });

        form.append("input_reference", blob, `first-frame.${ext}`);
    }

    return form;
}

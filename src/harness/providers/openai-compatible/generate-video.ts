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
    /**
     * One deadline for the whole call, derived from the tool's timeout (M9):
     * the wait may not run past `HarnessToolTimeoutMs` minus room for the
     * downloads, so submitting, waiting and downloading fit in one tool call
     * instead of the wait being cut off mid-download by the tool's own abort.
     */
    const call_started = Date.now();
    const deadline = call_started + AppData.HarnessToolTimeoutMs - AppData.VideoDownloadMarginMs;

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

    const job = await waitForJob({ candidate, job: started, signal, deadline });
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
            data: await readVideoBytes({ res, provider_name, candidate_key: candidate.key }),
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
    /**
     * The whole call's deadline (tool timeout minus download room, M9): the
     * wait stops here even if `VideoMaxWaitMs` would allow longer.
     */
    deadline: number;
};

/**
 * Checks on a job until it's done or failed. A check that fails on the way
 * (a timeout, a hiccup) doesn't end the wait: the job runs on at the
 * provider. A job still working at the deadline fails without benching the
 * model (it may just be slow), and is left to the provider. The deadline is
 * the smaller of `VideoMaxWaitMs` from now and the call's own deadline, so
 * the wait never runs past the tool's timeout (M9).
 */
async function waitForJob({ candidate, job, signal, deadline }: WaitParams): Promise<VideoJob> {
    const { provider } = candidate;
    const preset = grabProviderPreset({ kind: provider.kind });
    const provider_name = provider.name || preset.title;
    const wait_deadline = Math.min(deadline, Date.now() + AppData.VideoMaxWaitMs);
    const wait_started = Date.now();
    let current = job;

    while (current.state == "working") {
        if (Date.now() >= wait_deadline) {
            throw new HarnessError({
                message: `${provider_name}: The video still wasn't ready after ${Math.max(1, Math.round((Date.now() - wait_started) / 60000))} minutes.`,
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

/**
 * Reads a finished video's bytes with a ceiling (M9): a provider that hands
 * back an unbounded body is cut at `AppData.VideoOutputMaxBytes` rather than
 * buffered whole into memory. The body is streamed and accumulated up to the
 * cap, so an oversized video is refused as soon as it passes it.
 */
async function readVideoBytes({
    res,
    provider_name,
    candidate_key,
}: {
    res: Response;
    provider_name: string;
    candidate_key: string;
}): Promise<Uint8Array<ArrayBuffer>> {
    const max_bytes = AppData.VideoOutputMaxBytes;
    const fail = (message: string) => new HarnessError({ message: `${provider_name}: ${message}`, candidate_key });

    if (!res.body) {
        const buffer = new Uint8Array(await res.arrayBuffer());
        if (buffer.byteLength > max_bytes) throw fail("the video is larger than allowed.");
        return buffer;
    }

    const reader = res.body.getReader();
    const chunks: Uint8Array[] = [];
    let total = 0;

    try {
        for (;;) {
            const { done, value } = await reader.read();
            if (done) break;
            if (!value) continue;

            total += value.byteLength;
            if (total > max_bytes) {
                await reader.cancel().catch(() => {});
                throw fail("the video is larger than allowed.");
            }
            chunks.push(value);
        }
    } catch (error: unknown) {
        if (error instanceof HarnessError) throw error;
        throw fail("the video download was interrupted.");
    }

    const data = new Uint8Array(total);
    let offset = 0;
    for (const chunk of chunks) {
        data.set(chunk, offset);
        offset += chunk.byteLength;
    }

    return data;
}

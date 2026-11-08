import grabHarnessSetting from "@/src/functions/backend/db/harness/grab-harness-setting";
import HarnessError from "../harness-error";
import grabHarnessAdapter from "../providers/grab-harness-adapter";
import resolveHarnessCandidates from "../resolve/resolve-harness-candidates";
import withCandidates from "../resolve/with-candidates";
import type { HarnessUsage, HarnessVideoImage, HarnessVideoOutput } from "../types";
import buildUsageCall from "../usage/build-usage-call";
import recordHarnessUsage from "../usage/record-harness-usage";
import orderVideoCandidates from "./order-video-candidates";

type Params = {
    prompt: string;
    duration?: number;
    resolution?: string;
    aspect_ratio?: string;
    images?: HarnessVideoImage[];
    /**
     * Videos to change: https or `data:` URLs.
     */
    videos?: string[];
    audio?: boolean;
    signal?: AbortSignal;
    /**
     * Uses this bot's video models when it has its own.
     */
    bot_id?: number | string;
    /**
     * The workspace the call is in: its models win over the bot's.
     */
    workspace_id?: number | string | null;
};

/**
 * Makes a video with the video generation harness, or with video editing
 * when there are videos to change (`orderVideoCandidates` decides who
 * tries). Returns their bytes.
 */
export default async function generateVideo({
    prompt,
    duration,
    resolution,
    aspect_ratio,
    images,
    videos,
    audio,
    signal,
    bot_id,
    workspace_id,
}: Params) {
    const has_videos = Boolean(videos?.length);
    const has_images = Boolean(images?.length);
    const edit = has_videos ? await grabEdit({ bot_id, workspace_id }) : undefined;
    /**
     * Video generation turned off (or unpicked) still leaves a video
     * editing pick to work with.
     */
    const video = await resolveHarnessCandidates({ harness: "video", bot_id, workspace_id }).catch(
        (error: unknown) => {
            if (edit?.candidates.length) return [];
            throw error;
        },
    );
    const ordered = orderVideoCandidates({ images: has_images, videos: has_videos, video, edit });

    if (!ordered.length && (video.length || edit?.candidates.length)) {
        throw new HarnessError({
            message: has_videos
                ? `None of the video models here takes ${has_images ? "videos and images" : "videos"} to work from. A super admin can pick one under Video editing in Settings, under Models.`
                : `None of the video models here takes images to start from. Try without them, or a super admin can pick another model under Video generation in Settings, under Models.`,
            code: "unavailable",
        });
    }

    const harness_of = new Map(ordered.map(({ candidate, harness }) => [candidate.key, harness]));

    const { result } = await withCandidates<{ videos: HarnessVideoOutput[]; usage?: HarnessUsage }>({
        harness: edit?.picked ? "video_edit" : "video",
        candidates: ordered.map(({ candidate }) => candidate),
        on_success: async ({ candidate, result: made, failed, resting }): Promise<void> =>
            await recordHarnessUsage({
                call: buildUsageCall({
                    harness: harness_of.get(candidate.key) || "video",
                    candidate,
                    failed,
                    resting,
                    usage: made.usage,
                }),
            }),
        run: async (candidate) =>
            await grabHarnessAdapter({
                kind: candidate.provider.kind,
            }).generateVideo({
                candidate,
                prompt,
                duration,
                resolution,
                aspect_ratio,
                images,
                videos,
                audio,
                signal: signal || new AbortController().signal,
            }),
    });

    return result.videos;
}

/**
 * Video editing's setting and candidates, or undefined while it's off.
 */
async function grabEdit({
    bot_id,
    workspace_id,
}: {
    bot_id?: number | string;
    workspace_id?: number | string | null;
}) {
    const setting = await grabHarnessSetting({ harness: "video_edit", bot_id, workspace_id });

    if (!setting.enabled) return undefined;

    return {
        picked: Boolean(setting.model_id),
        fallback: setting.fallback,
        candidates: setting.model_id
            ? await resolveHarnessCandidates({ harness: "video_edit", bot_id, workspace_id })
            : [],
    };
}

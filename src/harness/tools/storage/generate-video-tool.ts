import { z } from "zod";
import { AppData } from "@/src/data/app-data";
import recordBotFile from "@/src/functions/backend/db/bot-files/record-bot-file";
import loadReferenceImages from "@/src/harness/image/load-reference-images";
import generateVideo from "@/src/harness/video/generate-video";
import loadSourceVideos from "@/src/harness/video/load-source-videos";
import parseFileRef from "@/src/utils/parse-file-ref";
import type { HarnessTool, HarnessVideoImage } from "../../types";
import {
    describeScope,
    fileRef,
    findNamedScope,
    formatBytes,
    type StorageToolContext,
} from "./storage-tool-context";

const SourceSchema = z.object({
    file: z
        .union([z.string().max(60), z.number().int().positive()])
        .optional()
        .describe(`A file in your files, by [file:ID] ref, e.g. "[file:12]"`),
    media_id: z.number().int().positive().optional().describe(`Or something the user uploaded, by media id`),
});

type Source = z.infer<typeof SourceSchema>;

type Args = {
    prompt: string;
    images?: (Source & { role?: HarnessVideoImage["role"] })[];
    videos?: Source[];
    duration?: number;
    resolution?: string;
    aspect_ratio?: string;
    audio?: boolean;
    path?: string;
    attach?: boolean;
    scope?: string;
};

/**
 * Makes a video with the video generation harness (video editing when it
 * passes videos to change: files the run reaches or the user's uploads)
 * and saves it in the bot's files, like `generate_image`. A video takes
 * minutes: the call waits for it (`AppData.VideoMaxWaitMs`).
 */
export default function generateVideoTool(context: StorageToolContext): HarnessTool<Args> {
    const own = context.scopes[0];

    return {
        name: "generate_video",
        description: `Make a short video from a description and save it in your files. It takes a few minutes and costs far more than an image, so make one only when asked for a video, with one clear prompt: what's in it, how it moves, the camera, the sound. To start or end on a picture, pass it in "images" with role first_frame or last_frame; to only follow an image's look or subject, role reference (frames and references don't mix: with frames, references are left out). To change an existing video (restyle it, swap the scene, add or remove something), pass it in "videos" and say in the prompt what to change. Images and videos are [file:ID] refs from list_files or the user's uploads by media id. Leave duration, resolution and aspect_ratio out unless the user asked: models take only some values, and an error lists the ones they do. The video is saved and can ride on this reply with "attach".`,
        schema: z.object({
            prompt: z.string().min(3).max(4000),
            images: z
                .array(
                    SourceSchema.extend({
                        role: z
                            .enum(["first_frame", "last_frame", "reference"])
                            .optional()
                            .describe(`first_frame (default), last_frame or reference`),
                    }),
                )
                .max(AppData.VideoImageMaxCount)
                .optional(),
            videos: z
                .array(SourceSchema)
                .max(AppData.VideoSourceMaxCount)
                .optional()
                .describe(`Videos to change`),
            duration: z.number().int().min(1).max(60).optional().describe(`Seconds`),
            resolution: z.string().max(10).optional().describe(`e.g. "720p", "1080p"`),
            aspect_ratio: z.string().max(10).optional().describe(`e.g. "16:9", "9:16", "1:1"`),
            audio: z.boolean().optional().describe(`Whether it has sound, for models that make it`),
            path: z
                .string()
                .max(300)
                .optional()
                .describe(`Where to save it, e.g. "videos/intro.mp4"; one is named for you otherwise`),
            attach: z.boolean().optional().describe(`Send it to the user with this reply`),
            scope: z.string().optional().describe(`"bot:<id>" or "workspace:<id>"`),
        }),
        run: async ({ args, signal }) => {
            const named = args.scope
                ? findNamedScope({ scopes: context.scopes, name: args.scope })
                : own;

            if (!named) {
                return `You can't save there. Your directories: ${context.scopes
                    .map((s) => `${s.scope}:${s.owner_id}`)
                    .join(", ")}.`;
            }

            const image_sources = (args.images || []).map(readSource);
            const video_sources = (args.videos || []).map(readSource);

            if ([...image_sources, ...video_sources].some((source) => !source)) {
                return `Give each image and video as a [file:ID] ref in "file" (list_files lists them) or an upload's "media_id".`;
            }

            const images: HarnessVideoImage[] = [];

            for (let index = 0; index < image_sources.length; index++) {
                const source = image_sources[index]!;
                const [url] = await loadReferenceImages({
                    user_id: context.user_id,
                    scopes: context.scopes,
                    file_ids: source.file_id ? [source.file_id] : [],
                    media_ids: source.media_id ? [source.media_id] : [],
                });

                if (url) images.push({ url, role: args.images?.[index]?.role || "first_frame" });
            }

            const videos = await loadSourceVideos({
                user_id: context.user_id,
                scopes: context.scopes,
                sources: video_sources as { file_id?: number; media_id?: number }[],
            });

            const made = await generateVideo({
                prompt: args.prompt,
                duration: args.duration,
                resolution: args.resolution,
                aspect_ratio: args.aspect_ratio,
                images,
                videos,
                audio: args.audio,
                signal,
                bot_id: context.bot_id,
                workspace_id: context.workspace_id,
            }).catch((error: unknown) => {
                const message = error instanceof Error ? error.message : String(error);
                throw new Error(`Video generation isn't working: ${message}`);
            });

            if (!made.length) {
                return `The video model sent nothing back. Tell the user, and try a simpler prompt.`;
            }

            const saved: string[] = [];

            for (let index = 0; index < made.length; index++) {
                const video = made[index]!;
                const ext = video.media_type.includes("webm")
                    ? "webm"
                    : video.media_type.includes("quicktime")
                      ? "mov"
                      : "mp4";
                const name =
                    args.path && made.length == 1
                        ? args.path
                        : `${stripExtension({ path: args.path || "video" })}${made.length > 1 ? `-${index + 1}` : ""}.${ext}`;

                const file = await recordBotFile({
                    bot_id: context.bot_id,
                    scope: named.scope,
                    owner_id: named.owner_id,
                    path: name,
                    data: video.data,
                    purpose: "video",
                    source: "tool",
                    media_type: "video",
                    mime_type: video.media_type,
                    user_id: context.user_id,
                });

                if (args.attach && file.media_id) {
                    context.onAttach?.({ media_id: Number(file.media_id), name: file.name || "" });
                }

                saved.push(
                    `${file.path} (${formatBytes({ bytes: Number(file.size) || 0 })}) ${fileRef({ file_id: file.id! })}`,
                );
            }

            const dropped =
                images.some((image) => image.role != "reference") &&
                images.some((image) => image.role == "reference") &&
                !videos.length
                    ? `\n\nThe reference images were left out: with frames, models take only the frames.`
                    : "";

            return `Made and saved ${saved.length} video(s) in ${describeScope(named)}:\n${saved.join("\n")}${
                args.attach ? "" : "\n\nIt isn't attached to this reply; the user sees it in your files."
            }${dropped}`;
        },
    };
}

/**
 * A source's file id or media id, or null when it names neither (or a
 * file ref that doesn't parse).
 */
function readSource(source: Source) {
    if (source.file !== undefined) {
        const file_id = parseFileRef({ ref: source.file });

        return file_id ? { file_id } : null;
    }

    return source.media_id ? { media_id: source.media_id } : null;
}

function stripExtension({ path }: { path: string }) {
    return path.replace(/\.[a-zA-Z0-9]{1,5}$/, "");
}

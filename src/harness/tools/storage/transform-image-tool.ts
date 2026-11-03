import sharp from "sharp";
import { z } from "zod";
import { AppData } from "@/src/data/app-data";
import grabBotFile from "@/src/functions/backend/db/bot-files/grab-bot-file";
import recordBotFile from "@/src/functions/backend/db/bot-files/record-bot-file";
import grabPictureSource from "@/src/functions/backend/db/profile-images/grab-picture-source";
import transformImage, { type ImageTransformFormat } from "@/src/harness/image/transform-image";
import {
    ImageTransformOperationSchema,
    type ImageTransformOperation,
} from "@/src/harness/image/image-transform-operations";
import imageOutputFormat from "@/src/utils/image-output-format";
import mediaFilePath from "@/src/utils/media-file-path";
import parseFileRef from "@/src/utils/parse-file-ref";
import type { HarnessTool } from "../../types";
import {
    describeScope,
    fileRef,
    findNamedScope,
    formatBytes,
    type StorageToolContext,
} from "./storage-tool-context";

type Args = {
    file?: string | number;
    media_id?: number;
    operations: ImageTransformOperation[];
    path?: string;
    format?: ImageTransformFormat;
    quality?: number;
    attach?: boolean;
    scope?: string;
};

/**
 * Transforms an image in the app with sharp (crop, resize, rotate, flip,
 * grayscale, blur, sharpen, brightness/saturation/hue, trim), no model and
 * no computer needed, and saves the result in the bot's files. The source
 * is a file the run reaches or the user's own upload, checked the way a
 * picture source is. The bot gets a small preview of the result back, so it
 * can check a crop landed where it meant before sending it.
 */
export default function transformImageTool(context: StorageToolContext): HarnessTool<Args> {
    const own = context.scopes[0];

    return {
        name: "transform_image",
        description: `Change an image's pixels without a model: crop, resize, rotate, flip, grayscale, blur, sharpen, adjust (brightness, saturation, hue) and trim (cut away a plain border). Steps run in the order given, each on the result of the one before. The source is a [file:ID] ref ("file") or an image the user uploaded ("media_id"). Crop boxes are in pixels of the upright image, or "percent" of its size when you don't know its pixels; the result says the source's size. The result is saved as a new file (unless "path" names the source's own) and shown back to you, so look at it and fix the box if it's off. Send it with "attach". This only cuts, turns and adjusts what is already there: to change what the image shows (a new background, a restyle, removing an object), use generate_image with the image as a reference.`,
        schema: z.object({
            file: z
                .union([z.string().max(60), z.number().int().positive()])
                .optional()
                .describe(`The image in your files, e.g. "[file:12]"`),
            media_id: z
                .number()
                .int()
                .positive()
                .optional()
                .describe(`An image the user uploaded, by media id`),
            operations: z.array(ImageTransformOperationSchema).max(AppData.ImageTransformMaxOperations),
            path: z
                .string()
                .max(AppData.BotFilePathMaxChars)
                .optional()
                .describe(`Where to save it, e.g. "images/logo-cropped.png"; named after the source otherwise`),
            format: z
                .enum(["png", "jpeg", "webp"])
                .optional()
                .describe(`Defaults to the source's (PNG for a GIF, JPEG for other kinds)`),
            quality: z.number().int().min(1).max(100).optional().describe(`JPEG/WebP, default 85`),
            attach: z.boolean().optional().describe(`Send it to the user with this reply`),
            scope: z.string().optional().describe(`"bot:<id>" or "workspace:<id>"`),
        }),
        run: async ({ args }) => {
            const named = args.scope
                ? findNamedScope({ scopes: context.scopes, name: args.scope })
                : own;

            if (!named) {
                return `You can't save there. Your directories: ${context.scopes
                    .map((s) => `${s.scope}:${s.owner_id}`)
                    .join(", ")}.`;
            }

            const file_id = args.file != undefined ? parseFileRef({ ref: args.file }) : null;

            if (args.file != undefined && !file_id) {
                return `Give the image as its [file:ID] ref, e.g. "[file:12]". list_files lists them.`;
            }

            if (!file_id == !args.media_id) {
                return `Give exactly one of "file" (a [file:ID] ref) and "media_id" (an upload).`;
            }

            const source_file = file_id
                ? await grabBotFile({ scopes: context.scopes, file_id })
                : null;
            const media = await grabPictureSource({
                user_id: context.user_id,
                scopes: context.scopes,
                file_id,
                media_id: args.media_id,
            });

            const absolute = mediaFilePath({ write_path: media?.media_write_path });
            const disk = absolute ? Bun.file(absolute) : null;

            if (!media || media.media_type != "image" || !disk || !(await disk.exists())) {
                return `That isn't an image you can transform. Use list_files to find one.`;
            }

            if (disk.size > AppData.ImageTransformMaxBytes) {
                return `That image is too large to transform (at most ${Math.round(AppData.ImageTransformMaxBytes / (1024 * 1024))} MB).`;
            }

            const source_name =
                source_file?.path || media.title || `image.${(media.mime_type || "").split("/").pop()}`;
            const format = args.format || imageOutputFormat({ ext: source_name }).format;
            const ext = format == "jpeg" ? "jpg" : format;

            const transformed = await transformImage({
                data: new Uint8Array(await disk.arrayBuffer()),
                operations: args.operations,
                format,
                quality: args.quality,
            });

            const path = args.path
                ? withExtension({ path: args.path, ext })
                : `${stripExtension({ path: source_name.replace(/^uploads\/[^/]+\//, "images/") })}-transformed.${ext}`;

            const file = await recordBotFile({
                bot_id: context.bot_id,
                scope: named.scope,
                owner_id: named.owner_id,
                path,
                data: transformed.data,
                purpose: "image",
                source: "tool",
                media_type: "image",
                mime_type: `image/${format}`,
                user_id: context.user_id,
            });

            if (args.attach && file.media_id) {
                context.onAttach?.({ media_id: Number(file.media_id), name: file.name || "" });
            }

            const preview = await sharp(transformed.data)
                .resize({
                    width: AppData.ImageTransformPreviewMaxSide,
                    height: AppData.ImageTransformPreviewMaxSide,
                    fit: "inside",
                    withoutEnlargement: true,
                })
                .png()
                .toBuffer();

            return {
                text: [
                    `Saved ${file.path} (${transformed.width}x${transformed.height}, ${formatBytes({ bytes: transformed.data.byteLength })}) in ${describeScope(named)}. ${fileRef({ file_id: file.id! })}`,
                    `The source was ${transformed.source_width}x${transformed.source_height} (upright).`,
                    args.attach ? "" : `It isn't attached to this reply; the user sees it in your files.`,
                    `[Result: shown after the tool results]`,
                ]
                    .filter(Boolean)
                    .join("\n"),
                images: [{ url: `data:image/png;base64,${preview.toString("base64")}` }],
            };
        },
    };
}

function stripExtension({ path }: { path: string }) {
    return path.replace(/\.[a-zA-Z0-9]{1,5}$/, "");
}

/**
 * The path with the extension the bytes are, so a "logo.png" saved as JPEG
 * isn't served as a PNG.
 */
function withExtension({ path, ext }: { path: string; ext: string }) {
    const current = path.match(/\.([a-zA-Z0-9]{1,5})$/)?.[1]?.toLowerCase();

    if (current == ext || (ext == "jpg" && current == "jpeg")) return path;

    return `${stripExtension({ path })}.${ext}`;
}

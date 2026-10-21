import { z } from "zod";
import enqueueFileIngest from "@/src/file-ingest/enqueue-file-ingest";
import recordBotFile from "@/src/functions/backend/db/bot-files/record-bot-file";
import generateImage from "@/src/harness/image/generate-image";
import type { HarnessTool } from "../../types";
import {
    describeScope,
    fileRef,
    findNamedScope,
    formatBytes,
    type StorageToolContext,
} from "./storage-tool-context";

type Args = {
    prompt: string;
    path?: string;
    size?: string;
    attach?: boolean;
    scope?: string;
};

/**
 * Makes an image with the image generation harness and saves it in the
 * bot's files, so it can be sent, shown again later or used by another
 * run. The bytes stay in the app's storage, never on a computer.
 */
export default function generateImageTool(context: StorageToolContext): HarnessTool<Args> {
    const own = context.scopes[0];

    return {
        name: "generate_image",
        description: `Make an image from a description and save it in your files. Describe what should be in it, in one clear prompt. The image is saved (so you can send it now and show it later) and can ride on this reply with "attach".`,
        schema: z.object({
            prompt: z.string().min(3).max(4000),
            path: z
                .string()
                .max(300)
                .optional()
                .describe(`Where to save it, e.g. "images/cover.png"; one is named for you otherwise`),
            size: z
                .string()
                .max(20)
                .optional()
                .describe(`e.g. "1024x1024", when the model takes one`),
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

            const images = await generateImage({
                prompt: args.prompt,
                size: args.size,
                signal,
                bot_id: context.bot_id,
                workspace_id: context.workspace_id,
            }).catch((error: unknown) => {
                const message = error instanceof Error ? error.message : String(error);
                throw new Error(`Image generation isn't working: ${message}`);
            });

            if (!images.length) {
                return `The image model sent nothing back. Tell the user, and try a simpler prompt.`;
            }

            const saved: string[] = [];

            for (let index = 0; index < images.length; index++) {
                const image = images[index]!;
                const ext = image.media_type.includes("png")
                    ? "png"
                    : image.media_type.includes("webp")
                      ? "webp"
                      : "jpg";
                const name =
                    args.path && images.length == 1
                        ? args.path
                        : `${stripExtension({ path: args.path || "image" })}${images.length > 1 ? `-${index + 1}` : ""}.${ext}`;

                const file = await recordBotFile({
                    bot_id: context.bot_id,
                    scope: named.scope,
                    owner_id: named.owner_id,
                    path: name,
                    data: image.data,
                    purpose: "image",
                    source: "tool",
                    media_type: "image",
                    mime_type: image.media_type,
                    user_id: context.user_id,
                });

                await enqueueFileIngest({ file_id: file.id! });

                if (args.attach && file.media_id) {
                    context.onAttach?.({ media_id: Number(file.media_id), name: file.name || "" });
                }

                saved.push(
                    `${file.path} (${formatBytes({ bytes: Number(file.size) || 0 })}) ${fileRef({ file_id: file.id! })}`,
                );
            }

            return `Made and saved ${saved.length} image(s) in ${describeScope(named)}:\n${saved.join("\n")}${
                args.attach ? "" : "\n\nIt isn't attached to this reply; the user sees it in your files."
            }`;
        },
    };
}

function stripExtension({ path }: { path: string }) {
    return path.replace(/\.[a-zA-Z0-9]{1,5}$/, "");
}

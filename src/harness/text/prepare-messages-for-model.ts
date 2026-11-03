import { MediaReadNote } from "@/src/data/harness-prompts";
import transcribeAudio from "../audio/transcribe-audio";
import HarnessError from "../harness-error";
import imageReadingKey from "../media/image-reading-key";
import readImage from "../media/read-image";
import type {
    HarnessContentPart,
    HarnessMessage,
    HarnessModelInfo,
} from "../types";

type Params = {
    messages: HarnessMessage[];
    model: Pick<HarnessModelInfo, "input_modalities">;
    /**
     * The text setting lets the model look at images itself
     * (`textSeesImages`). Off: every image is read for it, even when the
     * model takes images.
     */
    sees_images?: boolean;
    /**
     * Readings by media key, kept across candidates and steps so nothing is
     * read twice.
     */
    cache: Map<string, string>;
    signal: AbortSignal;
    /**
     * Reads media with this bot's models when it has its own.
     */
    bot_id?: number | string;
    /**
     * The workspace the call is in: its models win over the bot's.
     */
    workspace_id?: number | string | null;
    read_image?: typeof readImage;
    transcribe?: typeof transcribeAudio;
};

/**
 * Fits messages to a model's inputs: images it can't see (attached or
 * returned by tools) are read by the media reading harness and audio it
 * can't hear is transcribed, each replaced with a `[bracketed]` reading.
 * When the text setting turns on the model's own media reading, a model
 * that takes images gets them as they are, and the media reading harness
 * is only the fallback. A part that can't be read says so instead
 * of failing the call.
 */
export default async function prepareMessagesForModel({
    messages,
    model,
    sees_images = false,
    cache,
    signal,
    bot_id,
    workspace_id,
    read_image = readImage,
    transcribe = transcribeAudio,
}: Params): Promise<HarnessMessage[]> {
    const sees = sees_images && model.input_modalities.includes("image");
    const hears = model.input_modalities.includes("audio");
    let replaced = false;

    const fitPart = async (
        part: HarnessContentPart,
    ): Promise<HarnessContentPart> => {
        if (part.type == "image" && !sees) {
            replaced = true;
            return {
                type: "text",
                text: await readOnce({
                    key: imageReadingKey({ url: part.url, focus: part.focus }),
                    label: `Image${part.name ? ` "${part.name}"` : ""}`,
                    cache,
                    signal,
                    read: async () => {
                        const reading = await read_image({
                            url: part.url,
                            focus: part.focus,
                            signal,
                            bot_id,
                            workspace_id,
                        });

                        return part.redact ? part.redact(reading) : reading;
                    },
                }),
            };
        }

        if (part.type == "audio" && !hears) {
            replaced = true;
            return {
                type: "text",
                text: await readOnce({
                    key: `audio:${Bun.hash(part.data)}`,
                    label: `Audio${part.name ? ` "${part.name}"` : ""}, transcribed`,
                    cache,
                    signal,
                    read: () =>
                        transcribe({
                            audio: {
                                data: Buffer.from(part.data, "base64"),
                                format: part.format,
                            },
                            signal,
                            bot_id,
                            workspace_id,
                        }),
                }),
            };
        }

        return part;
    };

    const fitted: HarnessMessage[] = [];

    for (const message of messages) {
        if (message.role == "user" && typeof message.content != "string") {
            const content: HarnessContentPart[] = [];

            for (const part of message.content) {
                content.push(await fitPart(part));
            }

            fitted.push({ ...message, content });
        } else {
            fitted.push(message);
        }
    }

    if (!replaced) return fitted;

    const system = fitted.findIndex((message) => message.role == "system");

    if (system >= 0) {
        const message = fitted[system] as { role: "system"; content: string };
        fitted[system] = {
            role: "system",
            content: `${message.content}\n\n${MediaReadNote}`,
        };
    }

    return fitted;
}

async function readOnce({
    key,
    label,
    cache,
    signal,
    read,
}: {
    key: string;
    label: string;
    cache: Map<string, string>;
    signal: AbortSignal;
    read: () => Promise<string>;
}) {
    const cached = cache.get(key);

    if (cached !== undefined) return cached;

    try {
        const text = `[${label}: ${await read()}]`;
        cache.set(key, text);
        return text;
    } catch (error: unknown) {
        if (signal.aborted || (error instanceof HarnessError && error.code == "aborted")) {
            throw error;
        }

        return `[${label}: couldn't be read. ${error instanceof Error ? error.message : String(error)}]`;
    }
}

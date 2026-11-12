import { MediaReadNote } from "@/src/data/harness-prompts";
import transcribeAudio from "../audio/transcribe-audio";
import HarnessError from "../harness-error";
import type { ReadingCache } from "../media/create-reading-cache";
import imageReadingKey from "../media/image-reading-key";
import MediaReadings from "../media/media-readings";
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
    /**
     * Readings kept across runs (`MediaReadings`), so an image the
     * conversation carries is read once rather than once per reply. An
     * image with a `redact` is never written here: a secret's reading must
     * not outlive the run that asked for it.
     */
    readings?: ReadingCache;
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
    readings = MediaReadings,
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
                    readings,
                    share: !part.redact,
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
                    readings,
                    share: true,
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
    readings,
    share,
    signal,
    read,
}: {
    key: string;
    label: string;
    cache: Map<string, string>;
    readings: ReadingCache;
    /**
     * Whether the reading may be kept across runs. Not for an image read
     * so a secret can be cut out of it: that reading belongs to this run.
     */
    share: boolean;
    signal: AbortSignal;
    read: () => Promise<string>;
}) {
    const cached = cache.get(key) ?? (share ? readings.get({ key }) : undefined);

    if (cached !== undefined) {
        cache.set(key, cached);
        return cached;
    }

    try {
        const text = `[${label}: ${await read()}]`;
        cache.set(key, text);
        if (share) readings.set({ key, text });
        return text;
    } catch (error: unknown) {
        if (signal.aborted || (error instanceof HarnessError && error.code == "aborted")) {
            throw error;
        }

        return `[${label}: couldn't be read. ${error instanceof Error ? error.message : String(error)}]`;
    }
}

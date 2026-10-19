import { describe, expect, test } from "bun:test";
import { MediaReadNote } from "@/src/data/harness-prompts";
import type { HarnessMessage } from "../types";
import prepareMessagesForModel from "./prepare-messages-for-model";

const messages: HarnessMessage[] = [
    { role: "system", content: "You are a bot." },
    {
        role: "user",
        content: [
            { type: "text", text: "What's this?" },
            { type: "image", url: "data:image/png;base64,AAAA", name: "a.png" },
            { type: "audio", data: "AAAA", format: "mp3" },
        ],
    },
];

const signal = new AbortController().signal;

describe("prepareMessagesForModel", () => {
    test("keeps media the model can take", async () => {
        const fitted = await prepareMessagesForModel({
            messages,
            model: { input_modalities: ["text", "image", "audio"] },
            cache: new Map(),
            signal,
            read_image: async () => {
                throw new Error("should not read");
            },
        });

        expect(fitted).toEqual(messages);
    });

    test("reads media the model can't take, once, and notes it", async () => {
        const cache = new Map<string, string>();
        let reads = 0;
        const run = () =>
            prepareMessagesForModel({
                messages,
                model: { input_modalities: ["text"] },
                cache,
                signal,
                read_image: async () => {
                    reads++;
                    return "A red square.";
                },
                transcribe: async () => "hello there",
            });

        const fitted = await run();
        await run();

        expect(reads).toBe(1);
        expect(fitted[0]).toEqual({
            role: "system",
            content: `You are a bot.\n\n${MediaReadNote}`,
        });
        expect(fitted[1]).toEqual({
            role: "user",
            content: [
                { type: "text", text: "What's this?" },
                { type: "text", text: `[Image "a.png": A red square.]` },
                { type: "text", text: "[Audio, transcribed: hello there]" },
            ],
        });
    });

    test("says when a part can't be read instead of failing", async () => {
        const fitted = await prepareMessagesForModel({
            messages: [messages[1]!],
            model: { input_modalities: ["text", "audio"] },
            cache: new Map(),
            signal,
            read_image: async () => {
                throw new Error("No media reading model is set up.");
            },
        });

        expect(fitted[0]).toMatchObject({
            content: [
                {},
                {
                    type: "text",
                    text: `[Image "a.png": couldn't be read. No media reading model is set up.]`,
                },
                { type: "audio" },
            ],
        });
    });
});

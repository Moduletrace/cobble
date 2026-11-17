import { beforeEach, describe, expect, test } from "bun:test";
import { MediaReadNote } from "@/src/data/harness-prompts";
import createReadingCache from "../media/create-reading-cache";
import MediaReadings from "../media/media-readings";
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
    // Readings are kept across runs in one process-wide cache, so a test that
    // expects an image to be read must start without another test's reading.
    beforeEach(() => MediaReadings.clear());

    test("keeps media the model can take", async () => {
        const fitted = await prepareMessagesForModel({
            messages,
            model: { input_modalities: ["text", "image", "audio"] },
            sees_images: true,
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

    test("reads a tool image with its focus and redacts the reading", async () => {
        const asked: (string | undefined)[] = [];
        const fitted = await prepareMessagesForModel({
            messages: [
                {
                    role: "user",
                    content: [
                        {
                            type: "image",
                            url: "data:image/png;base64,BBBB",
                            focus: "the buttons",
                            redact: (text) => text.replaceAll("hunter2", "[secret]"),
                            from_tool: true,
                        },
                    ],
                },
            ],
            model: { input_modalities: ["text"] },
            cache: new Map(),
            signal,
            read_image: async ({ focus }) => {
                asked.push(focus);
                return "A login form filled with hunter2.";
            },
        });

        expect(asked).toEqual(["the buttons"]);
        expect(fitted[0]).toEqual({
            role: "user",
            content: [{ type: "text", text: "[Image: A login form filled with [secret].]" }],
        });
    });

    test("gives a tool image as it is to a model that sees", async () => {
        const image = {
            type: "image" as const,
            url: "data:image/png;base64,BBBB",
            focus: "the buttons",
            from_tool: true,
        };
        const fitted = await prepareMessagesForModel({
            messages: [{ role: "user", content: [image] }],
            model: { input_modalities: ["text", "image"] },
            sees_images: true,
            cache: new Map(),
            signal,
            read_image: async () => {
                throw new Error("should not read");
            },
        });

        expect(fitted[0]).toEqual({ role: "user", content: [image] });
    });

    test("a reading is kept across runs, so the same image isn't read twice", async () => {
        const readings = createReadingCache({ max: 4 });
        let reads = 0;
        const run = () =>
            prepareMessagesForModel({
                messages: [
                    { role: "user", content: [{ type: "image", url: "data:image/png;base64,CCCC" }] },
                ],
                model: { input_modalities: ["text"] },
                cache: new Map(),
                readings,
                signal,
                read_image: async () => {
                    reads++;
                    return "A cat.";
                },
            });

        await run();
        const second = await run();

        expect(reads).toBe(1);
        expect(readings.size()).toBe(1);
        expect(second[0]).toEqual({
            role: "user",
            content: [{ type: "text", text: "[Image: A cat.]" }],
        });
    });

    test("a reading made to redact secrets is not kept across runs", async () => {
        const readings = createReadingCache({ max: 4 });
        let reads = 0;
        const run = () =>
            prepareMessagesForModel({
                messages: [
                    {
                        role: "user",
                        content: [
                            {
                                type: "image",
                                url: "data:image/png;base64,DDDD",
                                redact: (text) => text.replaceAll("hunter2", "[secret]"),
                            },
                        ],
                    },
                ],
                model: { input_modalities: ["text"] },
                cache: new Map(),
                readings,
                signal,
                read_image: async () => {
                    reads++;
                    return "hunter2";
                },
            });

        const first = await run();
        await run();

        expect(first[0]).toEqual({
            role: "user",
            content: [{ type: "text", text: "[Image: [secret]]" }],
        });
        expect(reads).toBe(2);
        expect(readings.size()).toBe(0);
    });

    test("a redacted reading is kept within the run, so the image isn't read again every turn", async () => {
        // Every browser screenshot carries a redactor (secrets are cut from
        // what the vision model reads), so turning caching off to keep H3
        // once re-read the same screenshot on every turn of a run. The run's
        // own cache serves it, keyed apart from a plain reading, and nothing
        // of it outlives the run.
        const readings = createReadingCache({ max: 4 });
        const cache = new Map<string, string>();
        const url = "data:image/png;base64,FFFF";
        let reads = 0;
        const turn = () =>
            prepareMessagesForModel({
                messages: [
                    {
                        role: "user",
                        content: [{ type: "image", url, redact: (text) => text.replaceAll("hunter2", "[secret]") }],
                    },
                ],
                model: { input_modalities: ["text"] },
                cache,
                readings,
                signal,
                read_image: async () => {
                    reads++;
                    return "Signed in as hunter2.";
                },
            });

        await turn();
        const second = await turn();

        expect(reads).toBe(1);
        expect(second[0]).toEqual({
            role: "user",
            content: [{ type: "text", text: "[Image: Signed in as [secret].]" }],
        });
        expect(readings.size()).toBe(0);
    });

    test("a redacted reading is never served from an earlier unredacted reading of the same image", async () => {
        // The within-run cache is keyed by the image alone. An unredacted
        // reading of an image (a storage read) must not be handed back when
        // the same image is later read to cut a secret out (H3).
        const cache = new Map<string, string>();
        const url = "data:image/png;base64,EEEE";
        const read_image = async () => "the password is hunter2";

        const plain = await prepareMessagesForModel({
            messages: [{ role: "user", content: [{ type: "image", url }] }],
            model: { input_modalities: ["text"] },
            cache,
            readings: MediaReadings,
            signal,
            read_image,
        });
        expect(plain[0]).toEqual({
            role: "user",
            content: [{ type: "text", text: "[Image: the password is hunter2]" }],
        });

        const redacted = await prepareMessagesForModel({
            messages: [
                {
                    role: "user",
                    content: [{ type: "image", url, redact: (text) => text.replaceAll("hunter2", "[secret]") }],
                },
            ],
            model: { input_modalities: ["text"] },
            cache,
            readings: MediaReadings,
            signal,
            read_image,
        });
        expect(redacted[0]).toEqual({
            role: "user",
            content: [{ type: "text", text: "[Image: the password is [secret]]" }],
        });

        // The plain reading stays the only one kept: the redacted one is the
        // run's business alone, and the plain one is still served untouched.
        expect(MediaReadings.size()).toBe(1);
        const again = await prepareMessagesForModel({
            messages: [{ role: "user", content: [{ type: "image", url }] }],
            model: { input_modalities: ["text"] },
            cache,
            readings: MediaReadings,
            signal,
            read_image,
        });
        expect(again[0]).toEqual({
            role: "user",
            content: [{ type: "text", text: "[Image: the password is hunter2]" }],
        });
    });

    test("reads images for a model that sees when the setting is off", async () => {
        const fitted = await prepareMessagesForModel({
            messages: [
                { role: "user", content: [{ type: "image", url: "data:image/png;base64,CCCC" }] },
            ],
            model: { input_modalities: ["text", "image"] },
            cache: new Map(),
            signal,
            read_image: async () => "A cat.",
        });

        expect(fitted[0]).toEqual({
            role: "user",
            content: [{ type: "text", text: "[Image: A cat.]" }],
        });
    });
});

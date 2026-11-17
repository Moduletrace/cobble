import { afterAll, beforeEach, describe, expect, mock, test } from "bun:test";
import sharp from "sharp";
import { AppData } from "@/src/data/app-data";

/**
 * A read is paid for in pixels: the vision harness used to be handed the
 * full screenshot (1920 wide, 1.2-1.6 MB), which is a third more image
 * tokens than reading it at `AppData.HarnessVisionImageMaxSide` needs and
 * two to three times the wait, on every read of the same screen.
 *
 * The provider, the picker and the usage recorder are mocked; the shrinking
 * runs for real, so what the adapter is sent is the test.
 */
let sent: string[] = [];
let answer = "A design with a headline and a footer.";

const candidate = {
    key: "1:test-vl",
    provider: {
        id: 1,
        kind: "custom" as const,
        name: "Test",
        base_url: "https://models.test/v1",
        api_key: "key",
    },
    model: {
        slug: "test-vl",
        input_modalities: ["text", "image"],
        output_modalities: ["text"],
        supports_tools: false,
    },
    source: "pinned" as const,
};

mock.module("@/src/harness/resolve/resolve-harness-candidates", () => ({
    default: async () => [candidate],
}));
mock.module("@/src/harness/resolve/grab-model-rest-ms", () => ({
    default: async () => 1000,
}));
mock.module("@/src/harness/providers/grab-harness-adapter", () => ({
    default: () => ({
        chat: async ({ messages }: { messages: Array<{ content: Array<{ url?: string }> }> }) => {
            for (const part of messages[0]!.content) {
                if (part.url) sent.push(part.url);
            }

            return { text: answer };
        },
    }),
}));
mock.module("@/src/harness/text/grab-chat-params", () => ({
    default: async () => ({ source: "default", paramsFor: () => ({}) }),
}));
mock.module("@/src/harness/usage/record-harness-usage", () => ({
    default: async () => {},
}));

const readImage = (await import("./read-image")).default;

const inline = async ({ width, height }: { width: number; height: number }) => {
    const buffer = await sharp({
        create: { width, height, channels: 3, background: "#334455" },
    })
        .png()
        .toBuffer();

    return `data:image/png;base64,${buffer.toString("base64")}`;
};

const measure = async ({ url }: { url: string }) =>
    await sharp(Buffer.from(url.slice(url.indexOf(",") + 1), "base64")).metadata();

beforeEach(() => {
    sent = [];
    answer = "A design with a headline and a footer.";
});

afterAll(() => {
    mock.restore();
});

describe("readImage", () => {
    test("a full screenshot is read smaller than it was taken", async () => {
        const text = await readImage({ url: await inline({ width: 1920, height: 1400 }) });

        expect(text).toBe("A design with a headline and a footer.");
        expect(sent).toHaveLength(1);
        expect(await measure({ url: sent[0]! })).toMatchObject({
            width: AppData.HarnessVisionImageMaxSide,
        });
    });

    test("an image within the cap is read as it is", async () => {
        const url = await inline({ width: 800, height: 600 });
        await readImage({ url });

        expect(sent[0]!).toBe(url);
    });

    test("an https image is left to the provider to fetch", async () => {
        const url = "https://example.com/screenshot.png";
        await readImage({ url });

        expect(sent[0]!).toBe(url);
    });
});
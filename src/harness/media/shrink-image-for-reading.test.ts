import { describe, expect, test } from "bun:test";
import sharp from "sharp";
import { AppData } from "@/src/data/app-data";
import shrinkImageForReading from "./shrink-image-for-reading";

const inline = async ({
    width,
    height,
    format,
}: {
    width: number;
    height: number;
    format: "png" | "jpeg";
}) => {
    const drawn = sharp({ create: { width, height, channels: 3, background: "#334455" } });
    const buffer = format == "jpeg" ? await drawn.jpeg().toBuffer() : await drawn.png().toBuffer();

    return `data:image/${format};base64,${buffer.toString("base64")}`;
};

const measure = async ({ url }: { url: string }) =>
    await sharp(Buffer.from(url.slice(url.indexOf(",") + 1), "base64")).metadata();

const max = AppData.HarnessVisionImageMaxSide;

describe("shrinkImageForReading", () => {
    test("a wide screenshot is read at the cap, keeping its shape", async () => {
        const url = await inline({ width: 2000, height: 1000, format: "png" });
        const read = await shrinkImageForReading({ url });

        expect(await measure({ url: read })).toMatchObject({ width: max, height: max / 2 });
        expect(read.startsWith("data:image/png;base64,")).toBe(true);
    });

    test("a tall one is capped on its height", async () => {
        const url = await inline({ width: 800, height: 1600, format: "png" });
        const read = await shrinkImageForReading({ url });

        expect(await measure({ url: read })).toMatchObject({ width: max / 2, height: max });
    });

    test("an image already within the cap is sent untouched", async () => {
        const url = await inline({ width: 400, height: 300, format: "png" });

        expect(await shrinkImageForReading({ url })).toBe(url);
    });

    test("a jpeg stays a jpeg", async () => {
        const url = await inline({ width: 2000, height: 1000, format: "jpeg" });
        const read = await shrinkImageForReading({ url });

        expect(read.startsWith("data:image/jpeg;base64,")).toBe(true);
        expect(await measure({ url: read })).toMatchObject({ format: "jpeg", width: max });
    });

    test("an https image is left to the provider to fetch", async () => {
        const url = "https://example.com/screenshot.png";

        expect(await shrinkImageForReading({ url })).toBe(url);
    });

    test("bytes that aren't an image are sent as they came", async () => {
        const url = "data:image/png;base64,bm90aGluZyB0byBzZWUgaGVyZQ==";

        expect(await shrinkImageForReading({ url })).toBe(url);
    });
});
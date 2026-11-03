import { describe, expect, test } from "bun:test";
import sharp from "sharp";
import transformImage from "./transform-image";
import { ImageTransformOperationSchema } from "./image-transform-operations";

/**
 * A 200x100 PNG: left half red, right half blue.
 */
async function halves() {
    const red = await sharp({
        create: { width: 100, height: 100, channels: 4, background: { r: 255, g: 0, b: 0, alpha: 1 } },
    })
        .png()
        .toBuffer();

    return new Uint8Array(
        await sharp({
            create: { width: 200, height: 100, channels: 4, background: { r: 0, g: 0, b: 255, alpha: 1 } },
        })
            .composite([{ input: red, left: 0, top: 0 }])
            .png()
            .toBuffer(),
    );
}

async function pixel({ data, x, y }: { data: Uint8Array; x: number; y: number }) {
    const { data: raw, info } = await sharp(data).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    const at = (y * info.width + x) * 4;

    return [raw[at], raw[at + 1], raw[at + 2]];
}

describe("transformImage", () => {
    test("crops in pixels", async () => {
        const result = await transformImage({
            data: await halves(),
            operations: [{ op: "crop", x: 120, y: 10, width: 50, height: 40 }],
            format: "png",
        });

        expect([result.width, result.height]).toEqual([50, 40]);
        expect([result.source_width, result.source_height]).toEqual([200, 100]);
        expect(await pixel({ data: result.data, x: 0, y: 0 })).toEqual([0, 0, 255]);
    });

    test("crops in percent and clamps a box running off the edge", async () => {
        const result = await transformImage({
            data: await halves(),
            operations: [{ op: "crop", x: 0, y: 0, width: 50, height: 500, unit: "percent" }],
            format: "png",
        });

        expect([result.width, result.height]).toEqual([100, 100]);
        expect(await pixel({ data: result.data, x: 99, y: 99 })).toEqual([255, 0, 0]);
    });

    test("refuses a box outside the image, naming the step", async () => {
        await expect(
            transformImage({
                data: await halves(),
                operations: [{ op: "crop", x: 300, y: 0, width: 10, height: 10 }],
                format: "png",
            }),
        ).rejects.toThrow("Step 1 (crop)");
    });

    test("runs steps in the order given", async () => {
        const result = await transformImage({
            data: await halves(),
            operations: [
                { op: "flip", direction: "horizontal" },
                { op: "crop", x: 0, y: 0, width: 100, height: 100 },
                { op: "resize", width: 10 },
            ],
            format: "png",
        });

        expect([result.width, result.height]).toEqual([10, 10]);
        expect(await pixel({ data: result.data, x: 5, y: 5 })).toEqual([0, 0, 255]);
    });

    test("rotates by quarter turns", async () => {
        const result = await transformImage({
            data: await halves(),
            operations: [{ op: "rotate", degrees: 90 }],
            format: "jpeg",
        });

        expect([result.width, result.height]).toEqual([100, 200]);
    });

    test("refuses SVG", async () => {
        const svg = new TextEncoder().encode(
            `<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"><rect width="10" height="10"/></svg>`,
        );

        await expect(transformImage({ data: svg, operations: [], format: "png" })).rejects.toThrow("isn't an image");
    });
});

describe("ImageTransformOperationSchema", () => {
    test("refuses a misnamed field rather than dropping it", () => {
        expect(ImageTransformOperationSchema.safeParse({ op: "crop", x: 0, y: 0, w: 10, height: 10 }).success).toBe(
            false,
        );
    });
});

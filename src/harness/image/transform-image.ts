import sharp, { type OutputInfo } from "sharp";
import { AppData } from "@/src/data/app-data";
import AppError from "@/src/utils/app-error";
import type { ImageTransformOperation } from "./image-transform-operations";

/**
 * Formats a transform reads. Never SVG: it's a document, not pixels, and what
 * it references would be fetched while rendering.
 */
const TransformableFormats = ["jpeg", "png", "webp", "gif", "avif", "tiff"];

export type ImageTransformFormat = "png" | "jpeg" | "webp";

type Params = {
    data: Uint8Array;
    /**
     * Applied in order, each on the result of the one before.
     */
    operations: ImageTransformOperation[];
    format: ImageTransformFormat;
    /**
     * 1 to 100, for JPEG and WebP.
     */
    quality?: number;
};

type Raw = { data: Buffer; info: OutputInfo };

/**
 * Transforms an image with sharp (no model: the `image_edit` harness is
 * `generate_image` with references), one operation at a time on raw pixels, so the
 * order is the bot's (sharp's own pipeline runs its steps in a fixed order)
 * and nothing is re-compressed between steps. The source is turned upright
 * by its EXIF orientation first, so coordinates match what the bot saw.
 * Only the first frame of an animation is kept. Throws `AppError` with a
 * message for the bot when an operation can't apply.
 */
export default async function transformImage({
    data,
    operations,
    format,
    quality,
}: Params): Promise<{
    data: Uint8Array;
    width: number;
    height: number;
    source_width: number;
    source_height: number;
}> {
    const meta = await sharp(data, { limitInputPixels: AppData.ImageTransformMaxInputPixels })
        .metadata()
        .catch(() => null);

    if (!meta?.format || !TransformableFormats.includes(meta.format)) {
        throw new AppError(`That file isn't an image this tool can transform (PNG, JPEG, WebP, GIF, AVIF or TIFF).`);
    }

    let current: Raw = await sharp(data, { limitInputPixels: AppData.ImageTransformMaxInputPixels })
        .rotate()
        .ensureAlpha()
        .raw()
        .toBuffer({ resolveWithObject: true });

    const source_width = current.info.width;
    const source_height = current.info.height;

    for (let index = 0; index < operations.length; index++) {
        const operation = operations[index]!;

        try {
            current = await applyOperation({ current, operation });
        } catch (error) {
            const message = error instanceof Error ? error.message : String(error);

            throw new AppError(
                `Step ${index + 1} (${operation.op}) failed on a ${current.info.width}x${current.info.height} image: ${message}`,
            );
        }
    }

    let output = sharp(current.data, { raw: rawInput({ info: current.info }) });

    if (format == "jpeg") {
        output = output.flatten({ background: "#ffffff" }).jpeg({ quality: quality || 85, mozjpeg: true });
    } else if (format == "webp") {
        output = output.webp({ quality: quality || 85 });
    } else {
        output = output.png({ compressionLevel: 9 });
    }

    return {
        data: new Uint8Array(await output.toBuffer()),
        width: current.info.width,
        height: current.info.height,
        source_width,
        source_height,
    };
}

function rawInput({ info }: { info: OutputInfo }) {
    return { width: info.width, height: info.height, channels: info.channels as 1 | 2 | 3 | 4 };
}

/**
 * Runs one operation on raw pixels and returns raw pixels.
 */
async function applyOperation({
    current,
    operation,
}: {
    current: Raw;
    operation: ImageTransformOperation;
}): Promise<Raw> {
    const { width, height } = current.info;
    let image = sharp(current.data, { raw: rawInput({ info: current.info }) });

    switch (operation.op) {
        case "crop": {
            const percent = operation.unit == "percent";
            const left = Math.round(percent ? (operation.x / 100) * width : operation.x);
            const top = Math.round(percent ? (operation.y / 100) * height : operation.y);
            const right = Math.min(
                width,
                left + Math.round(percent ? (operation.width / 100) * width : operation.width),
            );
            const bottom = Math.min(
                height,
                top + Math.round(percent ? (operation.height / 100) * height : operation.height),
            );

            if (left < 0 || top < 0 || left >= width || top >= height || right <= left || bottom <= top) {
                throw new Error(`the crop box falls outside the image`);
            }

            image = image.extract({ left, top, width: right - left, height: bottom - top });
            break;
        }
        case "resize": {
            if (!operation.width && !operation.height) {
                throw new Error(`give a width, a height or both`);
            }

            image = image.resize({
                width: operation.width,
                height: operation.height,
                fit: operation.fit || "inside",
                background: { r: 0, g: 0, b: 0, alpha: 0 },
            });
            break;
        }
        case "rotate":
            image = image.rotate(operation.degrees, { background: { r: 0, g: 0, b: 0, alpha: 0 } });
            break;
        case "flip":
            image = operation.direction == "vertical" ? image.flip() : image.flop();
            break;
        case "grayscale":
            image = image.grayscale();
            break;
        case "blur":
            image = image.blur(operation.sigma || 3);
            break;
        case "sharpen":
            image = image.sharpen(operation.sigma ? { sigma: operation.sigma } : undefined);
            break;
        case "adjust":
            image = image.modulate({
                brightness: operation.brightness,
                saturation: operation.saturation,
                hue: operation.hue,
            });
            break;
        case "trim":
            image = image.trim({ threshold: operation.threshold ?? 10 });
            break;
    }

    const result = await image.ensureAlpha().raw().toBuffer({ resolveWithObject: true });

    if (
        result.info.width > AppData.ImageTransformMaxDimension ||
        result.info.height > AppData.ImageTransformMaxDimension
    ) {
        throw new Error(`the result would be larger than ${AppData.ImageTransformMaxDimension}px on a side`);
    }

    return result;
}

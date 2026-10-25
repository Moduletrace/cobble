import sharp from "sharp";
import { PwaInstallIconMinSide, PwaInstallIconSourceSide } from "@/src/data/pwa-data";
import AppError from "@/src/utils/app-error";

type Params = {
    buffer: Buffer;
    background: string;
};

/**
 * An uploaded icon image made into the square PNG the icon sets are drawn
 * from: decoded (never stored as sent), turned upright, cropped to the
 * centre and laid on paper. SVG is refused; it stays out of the server's
 * image decoder.
 */
export default async function normalizeInstallIconUpload({ buffer, background }: Params) {
    const meta = await sharp(buffer)
        .metadata()
        .catch(() => null);

    if (!meta?.width || !meta.height || !meta.format) {
        throw new AppError(`That file isn't an image.`);
    }

    if (!["png", "jpeg", "webp", "gif"].includes(meta.format)) {
        throw new AppError(`Upload a PNG, JPG or WebP image.`);
    }

    if (Math.min(meta.width, meta.height) < PwaInstallIconMinSide) {
        throw new AppError(
            `The image is ${meta.width} x ${meta.height}. Upload one at least ${PwaInstallIconMinSide} pixels on each side.`,
        );
    }

    return sharp(buffer, { animated: false })
        .rotate()
        .resize(PwaInstallIconSourceSide, PwaInstallIconSourceSide, { fit: "cover" })
        .flatten({ background })
        .png()
        .toBuffer();
}

import sharp, { type OverlayOptions } from "sharp";
import {
    PwaAppIconMarkScale,
    PwaCornerMarkInset,
    PwaCornerMarkScale,
    PwaFaviconCornerMarkInset,
    PwaFaviconCornerMarkScale,
    PwaInstallIconFiles,
    PwaMaskableMarkScale,
    PwaSquareCornerMarkInset,
    PwaSquareCornerMarkScale,
    type PwaInstallIcon,
    type PwaInstallIconFile,
} from "@/src/data/pwa-data";
import renderAppIcon from "./render-app-icon";

type Params = {
    icon: PwaInstallIcon;
    /**
     * The picked stone (`public/brand/icons/<stone>.svg`).
     */
    stone_svg: Buffer;
    /**
     * The stored square upload, for image mode.
     */
    image?: Buffer | null;
    background: string;
};

/**
 * Every file of an install's icon set (`PwaInstallIconFiles`), by name.
 * A stone icon is the stone on paper, like the stock one. An image fills
 * the icon, with the stone in the top-left corner when `mark` is on; its
 * favicon is cut to a circle, the mark kept inside it.
 */
export default async function renderInstallIcons({ icon, stone_svg, image, background }: Params) {
    const files: Record<string, Buffer> = {};

    for (const file of PwaInstallIconFiles) {
        files[file.name] =
            icon.mode == "image" && image
                ? await renderImageFile({ file, image, stone_svg, mark: icon.mark, background })
                : await renderStoneFile({ file, stone_svg, background });
    }

    return files;
}

async function renderStoneFile({
    file,
    stone_svg,
    background,
}: {
    file: PwaInstallIconFile;
    stone_svg: Buffer;
    background: string;
}) {
    if (file.kind == "favicon") {
        return sharp(stone_svg).resize(file.size, file.size).png().toBuffer();
    }

    return renderAppIcon({
        svg: stone_svg,
        size: file.size,
        scale: file.kind == "maskable" ? PwaMaskableMarkScale : PwaAppIconMarkScale,
        background,
    });
}

async function renderImageFile({
    file,
    image,
    stone_svg,
    mark,
    background,
}: {
    file: PwaInstallIconFile;
    image: Buffer;
    stone_svg: Buffer;
    mark: boolean;
    background: string;
}) {
    const base = sharp(image)
        .resize(file.size, file.size, { fit: "cover" })
        .flatten({ background });

    const layers: OverlayOptions[] = [];

    if (mark && file.kind != "plain") {
        const { scale, inset_scale } = markPlacement({ kind: file.kind });
        const mark_size = Math.max(1, Math.round(file.size * scale));
        const inset = Math.round(file.size * inset_scale);
        const stone = await sharp(stone_svg)
            .resize(mark_size, mark_size, { fit: "contain" })
            .png()
            .toBuffer();

        layers.push({ input: stone, left: inset, top: inset });
    }

    if (file.kind == "favicon") {
        const half = file.size / 2;
        const circle = Buffer.from(
            `<svg xmlns="http://www.w3.org/2000/svg" width="${file.size}" height="${file.size}"><circle cx="${half}" cy="${half}" r="${half}"/></svg>`,
        );

        layers.push({ input: circle, blend: "dest-in" });
    }

    // Layers apply in order, so the circle cuts the mark too.
    return base.ensureAlpha().composite(layers).png().toBuffer();
}

function markPlacement({ kind }: { kind: PwaInstallIconFile["kind"] }) {
    if (kind == "favicon") {
        return { scale: PwaFaviconCornerMarkScale, inset_scale: PwaFaviconCornerMarkInset };
    }

    if (kind == "any") {
        return { scale: PwaSquareCornerMarkScale, inset_scale: PwaSquareCornerMarkInset };
    }

    return { scale: PwaCornerMarkScale, inset_scale: PwaCornerMarkInset };
}

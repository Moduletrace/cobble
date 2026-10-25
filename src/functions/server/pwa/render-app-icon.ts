import sharp from "sharp";

type Params = {
    svg: Buffer;
    size: number;
    scale: number;
    background: string;
};

/**
 * A stone centred on opaque paper, with room around it for the launcher's
 * mask: the app icon (`bun run gen:favicon`) and a picked stone's icon.
 */
export default async function renderAppIcon({ svg, size, scale, background }: Params) {
    const mark_size = Math.max(1, Math.round(size * scale));
    const mark = await sharp(svg)
        .resize(mark_size, mark_size, { fit: "contain" })
        .png()
        .toBuffer();

    return sharp({
        create: {
            width: size,
            height: size,
            channels: 4,
            background,
        },
    })
        .composite([{ input: mark, gravity: "center" }])
        .png()
        .toBuffer();
}

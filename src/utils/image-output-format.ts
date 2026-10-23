type Params = {
    /**
     * The source's extension or name, e.g. `png` or `logo.png`.
     */
    ext?: string | null;
};

export type ImageOutputFormat = {
    /**
     * What sharp writes with: `png`, `webp` or `jpeg`.
     */
    format: "png" | "webp" | "jpeg";
    /**
     * The extension the stored file gets.
     */
    ext: string;
    /**
     * The MIME type recorded on the `media` row.
     */
    mime_type: string;
};

/**
 * What an uploaded image is stored as.
 *
 * Pictures (a bot's or a workspace's) keep the format they came in, so a
 * transparent PNG stays a PNG with its transparency: forcing every image
 * through JPEG flattened a logo's clear corners onto black. A GIF is stored
 * as a PNG, which keeps its transparency.
 *
 * Everything else (a photo, a screenshot, an attachment) stays JPEG, which
 * is what it has always been.
 */
export default function imageOutputFormat({ ext }: Params = {}): ImageOutputFormat {
    const source = (ext || "")
        .split(".")
        .pop()
        ?.toLowerCase()
        .replace(/[^a-z0-9]/g, "") || "";

    if (source == "png") return { format: "png", ext: "png", mime_type: "image/png" };
    if (source == "webp") return { format: "webp", ext: "webp", mime_type: "image/webp" };
    if (source == "gif") return { format: "png", ext: "png", mime_type: "image/png" };

    return { format: "jpeg", ext: "jpeg", mime_type: "image/jpeg" };
}

import { ImageViewerTallRatio, type ImageViewerMode } from "@/src/dict/image-viewer-dict";

type Size = { width: number; height: number };

/**
 * How a picture first opens: whole, unless it is far taller than the frame
 * (a full-page screenshot), which opens at the frame's width so it reads
 * from the top and scrolls down.
 */
export default function imageViewerDefaultMode({
    natural,
    frame,
}: {
    natural: Size;
    frame: Size;
}): Extract<ImageViewerMode, "fit" | "width"> {
    if (natural.width <= 0 || natural.height <= 0) return "fit";

    if (frame.width <= 0 || frame.height <= 0) return "fit";

    const picture = natural.height / natural.width;
    const window = frame.height / frame.width;

    return picture > window * ImageViewerTallRatio ? "width" : "fit";
}

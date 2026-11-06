import type { ImageViewerMode } from "@/src/dict/image-viewer-dict";

type Size = { width: number; height: number };

type Params = {
    mode: Exclude<ImageViewerMode, "custom">;
    natural: Size;
    frame: Size;
};

/**
 * The scale a preset shows a picture at: whole (`fit`), filling the
 * frame's width (`width`) or at its own size (`actual`). Neither fit
 * enlarges a picture smaller than the frame: zooming in does that.
 */
export default function imageViewerFitScale({ mode, natural, frame }: Params) {
    if (mode == "actual") return 1;

    if (natural.width <= 0 || natural.height <= 0) return 1;

    const frame_width = Math.max(1, frame.width);
    const frame_height = Math.max(1, frame.height);
    const by_width = frame_width / natural.width;

    if (mode == "width") return Math.min(1, by_width);

    return Math.min(1, by_width, frame_height / natural.height);
}

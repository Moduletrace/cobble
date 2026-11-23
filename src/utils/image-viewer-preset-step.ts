import { ImageViewerPresets, type ImageViewerMode, type ImageViewerPreset } from "@/src/dict/image-viewer-dict";

/**
 * The preset Tab moves to next: whole, the frame's width, actual size,
 * round again. A zoomed view (`custom`, not a preset) starts over at `fit`.
 */
export default function imageViewerPresetStep({ mode }: { mode: ImageViewerMode }): ImageViewerPreset {
    const index = ImageViewerPresets.indexOf(mode as ImageViewerPreset);

    return ImageViewerPresets[(index + 1) % ImageViewerPresets.length] ?? "fit";
}
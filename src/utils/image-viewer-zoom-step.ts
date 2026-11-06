import {
    ImageViewerMaxScale,
    ImageViewerMinScale,
    ImageViewerZoomSteps,
} from "@/src/dict/image-viewer-dict";

/**
 * The next zoom stop in or out from a scale, so a fit at 37% zooms in to
 * 50%, not 47%. Stays inside the viewer's range.
 */
export default function imageViewerZoomStep({
    scale,
    direction,
}: {
    scale: number;
    direction: "in" | "out";
}) {
    const margin = 0.001;

    if (direction == "in") {
        return ImageViewerZoomSteps.find((step) => step > scale + margin) || ImageViewerMaxScale;
    }

    return [...ImageViewerZoomSteps].reverse().find((step) => step < scale - margin) || ImageViewerMinScale;
}

import { ImageViewerMaxScale, ImageViewerMinScale } from "@/src/dict/image-viewer-dict";

/**
 * A scale kept inside the viewer's range (a wheel or pinch can ask for
 * anything).
 */
export default function imageViewerClampScale({ scale }: { scale: number }) {
    if (!Number.isFinite(scale)) return 1;

    return Math.min(ImageViewerMaxScale, Math.max(ImageViewerMinScale, scale));
}

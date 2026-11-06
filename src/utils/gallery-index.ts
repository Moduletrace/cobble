import type { FilePreviewItem } from "@/src/types";

/**
 * Where a file stands in a gallery, by its URL, or -1 when it isn't in it
 * (the preview then shows it alone, without Previous and Next).
 */
export default function galleryIndex({ gallery, url }: { gallery?: FilePreviewItem[]; url: string }) {
    if (!gallery?.length || !url) return -1;

    return gallery.findIndex((item) => item.url == url);
}

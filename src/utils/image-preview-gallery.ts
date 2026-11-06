import type { FilePreviewItem } from "@/src/types";
import filePreviewKind from "./file-preview-kind";

/**
 * The images in a list of files, in the list's order: what the preview
 * steps through with Previous and Next. Files without a URL are left out,
 * and so is every other kind (a gallery is for looking at pictures).
 */
export default function imagePreviewGallery({ items }: { items: FilePreviewItem[] }): FilePreviewItem[] {
    return items.filter(
        (item) =>
            Boolean(item.url) &&
            filePreviewKind({ name: item.name, media_type: item.media_type }) == "image",
    );
}

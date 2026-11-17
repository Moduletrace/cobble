import React from "react";
import type { FilePreviewItem } from "@/src/types";

/**
 * The whole conversation's images as one gallery, so opening any picture
 * steps through every image in the session (bot and user), not just the
 * ones on its own message. Null outside a thread, where a message keeps
 * its own gallery.
 */
export const SessionGalleryContext = React.createContext<FilePreviewItem[] | null>(null);

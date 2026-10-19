import { FileText, Film, Image as ImageIcon, Mic } from "lucide-react";
import type { MediaType } from "@/src/types";

type Props = {
    media_type?: MediaType;
    size?: number;
};

/**
 * The icon for a file's type.
 */
export default function AttachmentIcon({ media_type, size = 14 }: Props) {
    const Icon =
        media_type == "image"
            ? ImageIcon
            : media_type == "audio"
              ? Mic
              : media_type == "video"
                ? Film
                : FileText;

    return <Icon size={size} aria-hidden className="shrink-0" />;
}

import type { MediaType } from "@/src/types";

type Params = {
    /**
     * The browser's type, often empty or `application/octet-stream`.
     */
    mime?: string;
    name: string;
};

const AudioExtensions = ["mp3", "wav", "m4a", "ogg", "oga", "webm", "flac", "aac", "opus"];
const VideoExtensions = ["mp4", "mov", "mkv", "avi", "m4v"];
const ImageExtensions = ["jpg", "jpeg", "png", "webp", "gif", "bmp", "tiff", "tif", "avif"];

/**
 * What a chat attachment is, from its type and name: its media type and
 * the extension to store it under (the name's, else the type's).
 */
export default function attachmentFileKind({ mime = "", name }: Params): {
    media_type: MediaType;
    ext: string;
} {
    const type = mime.toLowerCase().split(";")[0]!.trim();
    const from_name = name.includes(".") ? name.split(".").pop()!.toLowerCase() : "";
    const from_type = type.split("/").pop()?.split("+")[0] || "";
    const ext = (from_name || (from_type == "octet-stream" ? "" : from_type) || "bin").replace(/[^a-z0-9]/g, "") || "bin";

    if (type.startsWith("image/") && type != "image/svg+xml") return { media_type: "image", ext };
    if (type.startsWith("audio/")) return { media_type: "audio", ext };
    if (type.startsWith("video/")) {
        return { media_type: ext == "webm" && !from_name ? "audio" : "video", ext };
    }
    if (ImageExtensions.includes(from_name)) return { media_type: "image", ext };
    if (AudioExtensions.includes(from_name)) return { media_type: "audio", ext };
    if (VideoExtensions.includes(from_name)) return { media_type: "video", ext };

    return { media_type: "document", ext };
}

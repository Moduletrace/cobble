import Img from "@moduletrace/twui/layout/Img";
import Stack from "@moduletrace/twui/layout/Stack";
import type { FilePreviewKind } from "@/src/utils/file-preview-kind";
import FilePreviewNotice from "./file-preview-notice";
import FilePreviewText from "./file-preview-text";

type Props = {
    kind: FilePreviewKind;
    name: string;
    url: string;
    size?: number;
};

/**
 * The preview itself, by kind. Media the browser draws itself (images,
 * PDFs, audio, video) load from the file's URL; text kinds are read into
 * the page (`FilePreviewText`). Nothing here runs the file: an SVG shows
 * through `<img>`, which runs no script, and an HTML page in a frame
 * sandboxed twice (the attribute here and the `sandbox` CSP the media
 * server sends with it, `servedFileHeaders`): no script, no forms, an
 * origin of its own.
 */
export default function FilePreviewBody({ kind, name, url, size }: Props) {
    if (kind == "image") {
        return (
            <Stack className="grow min-h-0 w-full items-center justify-center p-4 overflow-auto bg-sunken">
                <Img src={url} alt={name} className="max-w-full max-h-full object-contain" />
            </Stack>
        );
    }

    if (kind == "pdf") {
        return <iframe src={url} title={name} className="block grow w-full border-0 bg-paper" />;
    }

    if (kind == "html") {
        return <iframe src={url} title={name} sandbox="" referrerPolicy="no-referrer" className="block grow w-full border-0 bg-paper" />;
    }

    if (kind == "audio") {
        return (
            <Stack className="grow w-full items-center justify-center p-6">
                <audio src={url} controls preload="metadata" className="w-full max-w-xl" />
            </Stack>
        );
    }

    if (kind == "video") {
        return (
            <Stack className="grow min-h-0 w-full items-center justify-center p-4 bg-sunken">
                <video src={url} controls preload="metadata" className="max-w-full max-h-full" />
            </Stack>
        );
    }

    if (kind == "none") {
        return <FilePreviewNotice message="This kind of file can't be previewed here. Download it to open it." />;
    }

    return <FilePreviewText kind={kind} url={url} size={size} />;
}

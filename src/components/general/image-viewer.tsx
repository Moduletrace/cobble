import Img from "@moduletrace/twui/layout/Img";
import Stack from "@moduletrace/twui/layout/Stack";
import type { RefObject } from "react";
import { twMerge } from "tailwind-merge";
import useImageViewer from "@/src/hooks/use-image-viewer";
import useImageViewerGestures from "@/src/hooks/use-image-viewer-gestures";
import FilePreviewNotice from "./file-preview-notice";
import ImageViewerToolbar from "./image-viewer-toolbar";

type Props = {
    url: string;
    name: string;
};

/**
 * An image in the file preview, to inspect rather than glance at: zoom
 * (buttons, keys, Ctrl/Cmd + wheel or a pinch at the pointer), fit whole,
 * fit the width (a full-page screenshot opens that way and scrolls down),
 * actual size, double click to zoom into a spot, drag to move around.
 * The picture is sized with its `width` attribute, so no style is set,
 * and centred with auto margins, which (unlike flex centring) never push
 * the top of a picture taller than the frame out of reach.
 */
export default function ImageViewer({ url, name }: Props) {
    const viewer = useImageViewer();
    const { dragging, pointerHandlers } = useImageViewerGestures(viewer);
    const width = viewer.natural ? Math.max(1, Math.floor(viewer.natural.width * viewer.scale)) : undefined;

    return (
        <Stack className="grow min-h-0 w-full gap-0! items-stretch">
            <ImageViewerToolbar
                mode={viewer.mode}
                scale={viewer.scale}
                natural={viewer.natural}
                onZoom={(direction) => viewer.zoom({ direction })}
                onChoose={(mode) => viewer.choose({ mode })}
            />
            <Stack
                componentRef={viewer.container_ref as RefObject<HTMLDivElement>}
                {...pointerHandlers}
                onDoubleClick={(event) => viewer.toggle({ point: { x: event.clientX, y: event.clientY } })}
                className={twMerge(
                    "relative grow min-h-0 w-full gap-0! items-stretch overflow-auto overscroll-contain bg-sunken select-none",
                    viewer.scale < 1 && "cursor-zoom-in",
                    dragging && "cursor-grabbing",
                )}
            >
                <Stack className="shrink-0 w-max min-w-full min-h-full gap-0! items-start p-4">
                    <Img
                        ref={viewer.image_ref}
                        src={url}
                        alt={name}
                        loading="eager"
                        draggable={false}
                        width={width}
                        onLoad={viewer.onImageLoad}
                        imgErrComp={<FilePreviewNotice message="This image couldn't be loaded. Download it to open it." />}
                        className={twMerge(
                            "block shrink-0 m-auto h-auto object-contain",
                            width ? "max-w-none max-h-none" : "max-w-full max-h-full",
                        )}
                    />
                </Stack>
            </Stack>
        </Stack>
    );
}

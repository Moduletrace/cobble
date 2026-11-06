import Row from "@moduletrace/twui/layout/Row";
import Span from "@moduletrace/twui/layout/Span";
import { MoveHorizontal, Scan, Shrink, ZoomIn, ZoomOut } from "lucide-react";
import {
    ImageViewerMaxScale,
    ImageViewerMinScale,
    type ImageViewerMode,
} from "@/src/dict/image-viewer-dict";
import ImageViewerToolButton, { type ImageViewerTool } from "./image-viewer-tool-button";

type Props = {
    mode: ImageViewerMode;
    scale: number;
    natural: { width: number; height: number } | null;
    onZoom: (direction: "in" | "out") => void;
    onChoose: (mode: Exclude<ImageViewerMode, "custom">) => void;
};

/**
 * The image preview's controls: zoom out and in around the zoom level,
 * the presets (whole, the frame's width, actual size), and the picture's
 * own size in pixels.
 */
export default function ImageViewerToolbar({ mode, scale, natural, onZoom, onChoose }: Props) {
    const loaded = Boolean(natural);
    const zoom_out: ImageViewerTool = {
        id: "out",
        icon: ZoomOut,
        title: "Zoom out (-)",
        disabled: !loaded || scale <= ImageViewerMinScale,
        onClick: () => onZoom("out"),
    };
    const zoom_in: ImageViewerTool = {
        id: "in",
        icon: ZoomIn,
        title: "Zoom in (+)",
        disabled: !loaded || scale >= ImageViewerMaxScale,
        onClick: () => onZoom("in"),
    };
    const preset_tools: ImageViewerTool[] = [
        {
            id: "fit",
            icon: Shrink,
            title: "Show the whole image (0)",
            label: "Fit",
            pressed: mode == "fit",
            disabled: !loaded,
            onClick: () => onChoose("fit"),
        },
        {
            id: "width",
            icon: MoveHorizontal,
            title: "Fit the width and scroll down (W)",
            label: "Fit width",
            pressed: mode == "width",
            disabled: !loaded,
            onClick: () => onChoose("width"),
        },
        {
            id: "actual",
            icon: Scan,
            title: "Actual size, one image pixel per screen pixel (1)",
            label: "Actual size",
            pressed: mode == "actual",
            disabled: !loaded,
            onClick: () => onChoose("actual"),
        },
    ];

    return (
        <Row className="w-full gap-1! flex-wrap items-center px-3 py-1.5 border-0 border-b border-solid border-hairline bg-paper">
            <ImageViewerToolButton {...zoom_out} />
            <Span className="min-w-12 text-center text-[13px] leading-[18px] font-bold tabular-nums text-ink">
                {loaded ? `${Math.round(scale * 100)}%` : "..."}
            </Span>
            <ImageViewerToolButton {...zoom_in} />
            <Span className="inline-block mx-1 h-5 w-px bg-hairline" aria-hidden />
            {preset_tools.map((tool) => (
                <ImageViewerToolButton key={tool.id} {...tool} />
            ))}
            {natural ? (
                <Span className="ml-auto pl-2 text-[12px] leading-4 tabular-nums text-ink-secondary">
                    {`${natural.width} x ${natural.height} px`}
                    <Span className="hidden md:inline">{" · Ctrl + scroll to zoom, drag to move"}</Span>
                </Span>
            ) : null}
        </Row>
    );
}

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import type { ImageViewerMode } from "@/src/dict/image-viewer-dict";
import imageViewerClampScale from "@/src/utils/image-viewer-clamp-scale";
import imageViewerDefaultMode from "@/src/utils/image-viewer-default-mode";
import imageViewerFitScale from "@/src/utils/image-viewer-fit-scale";
import imageViewerZoomStep from "@/src/utils/image-viewer-zoom-step";

type Size = { width: number; height: number };

/**
 * A point on the screen (client coordinates) a zoom keeps still.
 */
export type ImageViewerPoint = { x: number; y: number };

/**
 * Where a zoom lands: the part of the picture under a point stays under it,
 * or the view goes back to the top left.
 */
type Anchor = { fx: number; fy: number; ax: number; ay: number } | "top";

/**
 * The frame's padding on each side (the frame's `p-4`), left out of the
 * room a fit has.
 */
const FramePadding = 16;

function clampUnit({ value }: { value: number }) {
    if (!Number.isFinite(value)) return 0.5;

    return Math.min(1, Math.max(0, value));
}

/**
 * The image preview's state: how big the picture is drawn and where the
 * frame is scrolled. A preset (`fit`, `width`, `actual`) follows the frame
 * as it resizes; a zoom keeps the part of the picture under the pointer
 * (or the frame's middle) where it was, so the user can walk into a detail.
 */
export default function useImageViewer() {
    const container_ref = useRef<HTMLDivElement>(null);
    const image_ref = useRef<HTMLImageElement>(null);
    const anchor_ref = useRef<Anchor | null>(null);
    const [natural, set_natural] = useState<Size | null>(null);
    const [frame, set_frame] = useState<Size>({ width: 0, height: 0 });
    const [mode, set_mode] = useState<ImageViewerMode | null>(null);
    const [custom_scale, set_custom_scale] = useState(1);
    const [tick, set_tick] = useState(0);

    useEffect(() => {
        const container = container_ref.current;

        if (!container || typeof ResizeObserver == "undefined") return;

        const measure = () =>
            set_frame({
                width: Math.max(0, container.clientWidth - FramePadding * 2),
                height: Math.max(0, container.clientHeight - FramePadding * 2),
            });

        measure();

        const observer = new ResizeObserver(measure);

        observer.observe(container);

        return () => observer.disconnect();
    }, []);

    useEffect(() => {
        if (mode || !natural || !frame.width) return;

        set_mode(imageViewerDefaultMode({ natural, frame }));
    }, [mode, natural, frame]);

    const shown_mode: ImageViewerMode = mode || "fit";
    const scale = !natural
        ? 1
        : shown_mode == "custom"
          ? custom_scale
          : imageViewerFitScale({ mode: shown_mode, natural, frame });
    const scale_ref = useRef(scale);

    scale_ref.current = scale;

    useLayoutEffect(() => {
        const anchor = anchor_ref.current;
        const container = container_ref.current;
        const image = image_ref.current;

        anchor_ref.current = null;

        if (!anchor || !container || !image) return;

        if (anchor == "top") {
            container.scrollTo({ left: 0, top: 0 });
            return;
        }

        container.scrollLeft = image.offsetLeft + anchor.fx * image.offsetWidth - anchor.ax;
        container.scrollTop = image.offsetTop + anchor.fy * image.offsetHeight - anchor.ay;
    }, [scale, tick]);

    /**
     * Which part of the picture is under a point (the frame's middle when
     * none is given), to keep it there after the zoom.
     */
    const captureAnchor = useCallback(({ point }: { point?: ImageViewerPoint }): Anchor | null => {
        const container = container_ref.current;
        const image = image_ref.current;

        if (!container || !image) return null;

        const box = container.getBoundingClientRect();
        const at = point || {
            x: box.left + container.clientLeft + container.clientWidth / 2,
            y: box.top + container.clientTop + container.clientHeight / 2,
        };
        const rect = image.getBoundingClientRect();

        return {
            fx: clampUnit({ value: (at.x - rect.left) / (rect.width || 1) }),
            fy: clampUnit({ value: (at.y - rect.top) / (rect.height || 1) }),
            ax: at.x - box.left - container.clientLeft,
            ay: at.y - box.top - container.clientTop,
        };
    }, []);

    const zoomTo = useCallback(
        ({ scale: next, point }: { scale: number; point?: ImageViewerPoint }) => {
            anchor_ref.current = captureAnchor({ point });
            set_custom_scale(imageViewerClampScale({ scale: next }));
            set_mode("custom");
            set_tick((value) => value + 1);
        },
        [captureAnchor],
    );

    const zoom = useCallback(
        ({ direction, point }: { direction: "in" | "out"; point?: ImageViewerPoint }) =>
            zoomTo({ scale: imageViewerZoomStep({ scale: scale_ref.current, direction }), point }),
        [zoomTo],
    );

    /**
     * A preset. Fitting starts from the top left (a page screenshot reads
     * from its top); actual size keeps the point (or the middle) in view.
     */
    const choose = useCallback(
        ({ mode: next, point }: { mode: Exclude<ImageViewerMode, "custom">; point?: ImageViewerPoint }) => {
            anchor_ref.current = next == "actual" ? captureAnchor({ point }) : "top";
            set_mode(next);
            set_tick((value) => value + 1);
        },
        [captureAnchor],
    );

    /**
     * A double click: into actual size at that point from anything
     * smaller, else back to the picture's own fit.
     */
    const toggle = useCallback(
        ({ point }: { point: ImageViewerPoint }) => {
            if (scale_ref.current < 1) return choose({ mode: "actual", point });

            if (!natural) return;

            choose({ mode: imageViewerDefaultMode({ natural, frame }) });
        },
        [choose, natural, frame],
    );

    const onImageLoad = useCallback(() => {
        const image = image_ref.current;

        if (!image?.naturalWidth || !image.naturalHeight) return;

        set_natural({ width: image.naturalWidth, height: image.naturalHeight });
    }, []);

    useEffect(() => {
        if (image_ref.current?.complete) onImageLoad();
    }, [onImageLoad]);

    return {
        container_ref,
        image_ref,
        natural,
        mode: shown_mode,
        scale,
        scale_ref,
        zoom,
        zoomTo,
        choose,
        toggle,
        onImageLoad,
    };
}

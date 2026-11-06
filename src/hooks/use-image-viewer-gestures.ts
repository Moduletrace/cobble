import { useEffect, useRef, useState, type PointerEvent, type RefObject } from "react";
import type { ImageViewerMode } from "@/src/dict/image-viewer-dict";
import type { ImageViewerPoint } from "./use-image-viewer";

type Params = {
    container_ref: RefObject<HTMLDivElement | null>;
    scale_ref: RefObject<number>;
    zoom: (params: { direction: "in" | "out"; point?: ImageViewerPoint }) => void;
    zoomTo: (params: { scale: number; point?: ImageViewerPoint }) => void;
    choose: (params: { mode: Exclude<ImageViewerMode, "custom">; point?: ImageViewerPoint }) => void;
};

/**
 * How much one wheel pixel zooms (a trackpad pinch arrives as small
 * Ctrl+wheel steps, a mouse wheel as large ones).
 */
const WheelZoomRate = 0.0025;

function typingInField({ target }: { target: EventTarget | null }) {
    if (!(target instanceof HTMLElement)) return false;

    if (target.isContentEditable) return true;

    return ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName);
}

/**
 * The image preview's hands: Ctrl/Cmd + wheel (and a trackpad pinch) zooms
 * at the pointer, a plain wheel scrolls, dragging with the mouse moves a
 * picture bigger than the frame, and the keys `+` `-` zoom, `0` fits, `w`
 * fits the width and `1` shows actual size.
 */
export default function useImageViewerGestures({ container_ref, scale_ref, zoom, zoomTo, choose }: Params) {
    const drag_ref = useRef<{ x: number; y: number; left: number; top: number } | null>(null);
    const [dragging, set_dragging] = useState(false);

    useEffect(() => {
        const container = container_ref.current;

        if (!container) return;

        const onWheel = (event: WheelEvent) => {
            if (!event.ctrlKey && !event.metaKey) return;

            event.preventDefault();

            const pixels = event.deltaMode == 1 ? event.deltaY * 16 : event.deltaY;
            const factor = Math.exp(-pixels * WheelZoomRate);

            zoomTo({ scale: scale_ref.current * factor, point: { x: event.clientX, y: event.clientY } });
        };

        container.addEventListener("wheel", onWheel, { passive: false });

        return () => container.removeEventListener("wheel", onWheel);
    }, [container_ref, scale_ref, zoomTo]);

    useEffect(() => {
        const onKey = (event: KeyboardEvent) => {
            if (event.ctrlKey || event.metaKey || event.altKey) return;

            if (typingInField({ target: event.target })) return;

            if (event.key == "+" || event.key == "=") zoom({ direction: "in" });
            else if (event.key == "-" || event.key == "_") zoom({ direction: "out" });
            else if (event.key == "0") choose({ mode: "fit" });
            else if (event.key == "w" || event.key == "W") choose({ mode: "width" });
            else if (event.key == "1") choose({ mode: "actual" });
            else return;

            event.preventDefault();
        };

        window.addEventListener("keydown", onKey);

        return () => window.removeEventListener("keydown", onKey);
    }, [zoom, choose]);

    const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
        const container = container_ref.current;

        if (!container || event.pointerType != "mouse" || event.button != 0) return;

        const overflows =
            container.scrollWidth > container.clientWidth || container.scrollHeight > container.clientHeight;

        if (!overflows) return;

        event.preventDefault();
        container.setPointerCapture(event.pointerId);
        drag_ref.current = {
            x: event.clientX,
            y: event.clientY,
            left: container.scrollLeft,
            top: container.scrollTop,
        };
        set_dragging(true);
    };

    const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
        const container = container_ref.current;
        const drag = drag_ref.current;

        if (!container || !drag) return;

        container.scrollLeft = drag.left - (event.clientX - drag.x);
        container.scrollTop = drag.top - (event.clientY - drag.y);
    };

    const onPointerUp = (event: PointerEvent<HTMLDivElement>) => {
        if (!drag_ref.current) return;

        drag_ref.current = null;
        set_dragging(false);
        container_ref.current?.releasePointerCapture(event.pointerId);
    };

    return {
        dragging,
        pointerHandlers: {
            onPointerDown,
            onPointerMove,
            onPointerUp,
            onPointerCancel: onPointerUp,
        },
    };
}

import { useEffect, useRef, useState } from "react";
import { twMerge } from "tailwind-merge";
import Span from "@moduletrace/twui/layout/Span";
import { GraphicSizeMessageType } from "@/src/dict/graphics-dict";
import useDocumentDark from "@/src/hooks/use-document-dark";
import graphicUrl from "@/src/utils/graphic-url";

type Props = {
    graphic_id: number;
    title: string;
    version?: number;
    /**
     * Grow to fit the graphic up to this height (px), then scroll inside.
     * Left out, the frame fills its container (`className` sizes it).
     */
    max_height?: number;
    className?: string;
};

const MinHeight = 120;

/**
 * A bot graphic in a sandboxed frame (`/graphics/<id>`): scripts run, but
 * under an origin of its own with no network, so it can't reach the app
 * or send anything out. A raw iframe: twui has no equivalent. In the
 * page's theme, sized to the height the graphic reports. A graphic that
 * navigates its frame away is closed, since that's never what a graphic
 * is for.
 */
export default function GraphicFrame({ graphic_id, title, version, max_height, className }: Props) {
    const dark = useDocumentDark();
    const frame = useRef<HTMLIFrameElement>(null);
    const loads = useRef(0);
    const [height, setHeight] = useState(MinHeight);
    const [moved, setMoved] = useState(false);
    const src = graphicUrl({ graphic_id, dark, version });

    useEffect(() => {
        loads.current = 0;
        setMoved(false);
    }, [src]);

    useEffect(() => {
        if (!max_height) return;

        const onMessage = (event: MessageEvent) => {
            if (event.source !== frame.current?.contentWindow) return;
            if (event.data?.type !== GraphicSizeMessageType) return;

            const reported = Number(event.data.height);

            if (Number.isFinite(reported)) setHeight(Math.min(max_height, Math.max(MinHeight, Math.ceil(reported))));
        };

        window.addEventListener("message", onMessage);

        return () => window.removeEventListener("message", onMessage);
    }, [max_height]);

    if (moved) {
        return (
            <Span className="block w-full px-3 py-4 text-[13px] leading-[18px] text-ink-secondary bg-sunken">
                {`This graphic tried to open another page, so it was closed.`}
            </Span>
        );
    }

    return (
        <iframe
            key={src}
            ref={frame}
            src={src}
            title={title}
            sandbox="allow-scripts"
            referrerPolicy="no-referrer"
            loading="lazy"
            height={max_height ? height : undefined}
            onLoad={() => {
                loads.current += 1;

                if (loads.current > 1) setMoved(true);
            }}
            className={twMerge("block w-full border-0 bg-paper", className)}
        />
    );
}

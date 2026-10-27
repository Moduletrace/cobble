import { useState } from "react";
import Button from "@moduletrace/twui/layout/Button";
import Link from "@moduletrace/twui/layout/Link";
import Span from "@moduletrace/twui/layout/Span";
import { ChartColumn, Maximize2, SquareArrowOutUpRight } from "lucide-react";
import GraphicFrame from "@/src/components/general/graphic-frame";
import GraphicViewerModal from "@/src/components/general/graphic-viewer-modal";
import { AppData } from "@/src/data/app-data";
import { graphicPageHref } from "@/src/utils/graphic-url";
import useBotGraphic from "../(hooks)/use-bot-graphic";

type Props = {
    graphic_id: number;
};

const ActionClassName =
    "shrink-0 p-1! text-ink-secondary dark:text-ink-secondary hover:text-ink rounded-default-xs";

/**
 * A graphic a bot made (`graphicRef`), shown where the bot named it: its
 * title and the graphic itself, sized to fit (up to
 * `AppData.BotGraphicInlineMaxHeight`), with ways to open it large or on
 * its own page. Built from spans, since the ref sits in a paragraph.
 * Anyone it wasn't made for sees its number only.
 */
export default function GraphicRefCard({ graphic_id }: Props) {
    const { view, loading } = useBotGraphic({ graphic_id });
    const [open, setOpen] = useState(false);

    if (!view) {
        return (
            <Span className="font-bold">
                {loading
                    ? `graphic ${graphic_id}`
                    : `graphic ${graphic_id} (not available)`}
            </Span>
        );
    }

    return (
        <Span className="flex w-full flex-col my-1 overflow-hidden rounded-default border border-solid border-hairline">
            <Span className="flex w-full flex-nowrap items-center gap-2 pl-3 pr-1.5 py-1.5 border-0 border-b border-solid border-hairline bg-surface">
                <ChartColumn
                    size={14}
                    aria-hidden
                    className="shrink-0 text-ink-secondary"
                />
                <Span className="min-w-0 grow truncate text-[13px] leading-5 font-bold text-ink">
                    {view.title}
                </Span>
                <Button
                    type="button"
                    variant="ghost"
                    color="text"
                    title="Open large"
                    aria-label="Open large"
                    onClick={() => setOpen(true)}
                    className={ActionClassName}
                >
                    <Maximize2 size={14} aria-hidden />
                </Button>
                <Link
                    href={graphicPageHref({
                        graphic_id: view.id,
                        bot_id: view.bot_id,
                    })}
                    title="Open on its own page"
                    aria-label="Open on its own page"
                    className={ActionClassName}
                    target="_blank"
                >
                    <SquareArrowOutUpRight size={14} aria-hidden />
                </Link>
            </Span>
            <GraphicFrame
                graphic_id={view.id}
                title={view.title}
                version={view.version}
                max_height={AppData.BotGraphicInlineMaxHeight}
            />
            {open ? (
                <GraphicViewerModal
                    graphic={view}
                    onClose={() => setOpen(false)}
                />
            ) : null}
        </Span>
    );
}

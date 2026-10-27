import Modal from "@moduletrace/twui/elements/Modal";
import H2 from "@moduletrace/twui/layout/H2";
import Link from "@moduletrace/twui/layout/Link";
import Row from "@moduletrace/twui/layout/Row";
import Span from "@moduletrace/twui/layout/Span";
import Stack from "@moduletrace/twui/layout/Stack";
import { SquareArrowOutUpRight } from "lucide-react";
import type { BotGraphicView } from "@/src/types";
import { graphicPageHref } from "@/src/utils/graphic-url";
import GraphicFrame from "./graphic-frame";

type Props = {
    graphic: BotGraphicView;
    onClose: () => void;
};

/**
 * A graphic large, over the page, with a link to its own page.
 */
export default function GraphicViewerModal({ graphic, onClose }: Props) {
    return (
        <Modal
            open
            setOpen={(next_open) => {
                if (!next_open) onClose();
            }}
            className="max-w-[95vw]! w-[1200px] h-[90vh] p-0 bg-paper flex flex-col overflow-hidden"
        >
            <Row className="w-full gap-3! flex-nowrap items-center pl-5 pr-14 py-3 border-0 border-b border-solid border-hairline">
                <Stack className="min-w-0 gap-0! items-start">
                    <H2 className="text-base! leading-6! tracking-normal! font-bold text-ink truncate w-full">
                        {graphic.title}
                    </H2>
                    <Span className="text-[13px] leading-[18px] text-ink-secondary">{`By ${graphic.bot_name}`}</Span>
                </Stack>
                <Link
                    href={graphicPageHref({
                        graphic_id: graphic.id,
                        bot_id: graphic.bot_id,
                    })}
                    title="Open on its own page"
                    aria-label="Open on its own page"
                    className="ml-auto shrink-0 p-2 text-ink-secondary hover:text-ink rounded-default hover:bg-sunken"
                    target="_blank"
                >
                    <SquareArrowOutUpRight size={16} aria-hidden />
                </Link>
            </Row>
            <GraphicFrame
                graphic_id={graphic.id}
                title={graphic.title}
                version={graphic.version}
                className="grow h-full"
            />
        </Modal>
    );
}

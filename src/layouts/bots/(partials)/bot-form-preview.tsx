import Row from "@moduletrace/twui/layout/Row";
import Span from "@moduletrace/twui/layout/Span";
import Stack from "@moduletrace/twui/layout/Stack";
import BotAvatar from "@/src/components/general/bot-avatar";
import BotStone from "@/src/components/general/bot-stone";
import type { BotStoneShape } from "@/src/dict/bot-dict";
import { paletteColorTitle } from "@/src/utils/bot-color";

type Props = {
    name: string;
    role: string;
    /**
     * Null for the coordinator.
     */
    color: string | null;
    stone: BotStoneShape;
    image_media_id?: number | string | null;
    picked_src?: string;
};

/**
 * How the bot will look in the rail as the form is filled in: its picture
 * or stone, name and job, and its colour (a small stone beside the name
 * when a picture hides the big one).
 */
export default function BotFormPreview({
    name,
    role,
    color,
    stone,
    image_media_id,
    picked_src,
}: Props) {
    const has_picture = Boolean(picked_src || image_media_id);
    /** A palette colour by name, else a colour the user made up. */
    const color_title = color
        ? paletteColorTitle({ color }) || "Its own colour"
        : null;

    return (
        <Row className="min-w-0 grow gap-3! flex-nowrap items-center">
            <BotAvatar
                color={color}
                stone={stone}
                size={56}
                image_media_id={image_media_id}
                src={picked_src}
            />
            <Stack className="min-w-0 gap-0!">
                <Row className="min-w-0 w-full gap-1.5! flex-nowrap items-center">
                    <Span className="text-sm font-bold leading-5 text-ink truncate">
                        {name.trim() || "Its name"}
                    </Span>
                    {has_picture && color ? (
                        <BotStone
                            color={color}
                            stone={stone}
                            size={18}
                            label={`${color_title} bot`}
                        />
                    ) : null}
                </Row>
                <Span className="text-xs leading-4 text-ink-secondary truncate w-full">
                    {role.trim() || "Its job"}
                </Span>
                {color_title ? (
                    <Span className="text-[11px] leading-4 text-ink-secondary">
                        {color_title}
                    </Span>
                ) : null}
            </Stack>
        </Row>
    );
}

import type { BotStoneShape } from "@/src/dict/bot-dict";
import { resolveBotColor, resolveBotStone } from "./bot-color";

type Params = {
    /**
     * The bot's own colour. Null or missing for the coordinator.
     */
    color?: string | null;
    stone?: string | null;
    /**
     * The historical palette hue, only for a bot saved before colours were
     * free. Rows from otherwise-typed queries select it as `bot_hue`.
     */
    hue?: string | null;
};

type BotStoneProps = {
    color: string | null;
    stone: BotStoneShape;
};

/**
 * The stone props for a bot row: which colour to fill it with and which
 * shape to draw, whether the row carries the new columns or only the
 * palette hue they replaced. Every `<BotAvatar color={...} stone={...} />`
 * call site goes through this, so a row saved before colours were free
 * still renders as it did.
 */
export default function botStoneProps({ color, stone, hue }: Params): BotStoneProps {
    return {
        color: resolveBotColor({ color, hue }),
        stone: resolveBotStone({ stone, hue }),
    };
}

import { twMerge } from "tailwind-merge";
import type { BotFace, BotStoneShape } from "@/src/dict/bot-dict";
import {
    CoordinatorBodyPath,
    StoneBodyPaths,
    StoneViewBox,
} from "@/src/data/stone-geometry";
import { botColorNeedsPaperFace, resolveBotStone } from "@/src/utils/bot-color";
import BotStoneFace from "./bot-stone-face";

type Props = {
    /**
     * The bot's identity colour (`#rrggbb`). Omit (or `null`) for the
     * coordinator, which renders hue-less: ink body, paper eyes, inverted in
     * dark mode.
     *
     * A bot's colour is user data, so it reaches the SVG as a `fill`
     * attribute rather than a theme token or a Tailwind class: an arbitrary
     * hex has no token to point at. This is the one place the palette rule
     * bends; everything else in the app still uses `--color-*`.
     */
    color?: string | null;
    /**
     * Which flat-cut stone to draw. Defaults to the shape this bot used to
     * be tied to, else the first one.
     */
    stone?: BotStoneShape | null;
    /**
     * Historical palette hue, only to pick the shape and colour of a bot
     * saved before they were stored apart.
     */
    hue?: string | null;
    face?: BotFace;
    size?: number;
    /**
     * Accessible name. Leave empty when a visible bot name sits beside the
     * stone (the default), so the stone is decorative.
     */
    label?: string;
    className?: string;
};

/**
 * # Bot Stone
 * @description A Cobble bot avatar: a stone with exactly one flat cut and two
 * eyes. Never put it in a circle, ring or badge, or add an outline or shadow.
 */
export default function BotStone({
    color,
    stone,
    hue,
    face = "idle",
    size = 32,
    label,
    className,
}: Props) {
    const is_coordinator = !color;
    const body_path = is_coordinator
        ? CoordinatorBodyPath
        : StoneBodyPaths[resolveBotStone({ stone, hue })];
    /**
     * A very dark body keeps its eyes readable in paper; the coordinator is
     * always paper, since its body is ink.
     */
    const paper_face = is_coordinator || botColorNeedsPaperFace({ color: color! });
    const eye_fill = paper_face ? "fill-paper" : "fill-dark";
    const eye_stroke = paper_face ? "stroke-paper" : "stroke-dark";

    return (
        <svg
            width={size}
            height={size}
            viewBox={StoneViewBox}
            role={label ? "img" : undefined}
            aria-label={label || undefined}
            aria-hidden={label ? undefined : true}
            className={twMerge("shrink-0", className)}
        >
            <path
                d={body_path}
                fill={is_coordinator ? undefined : color!}
                className={is_coordinator ? "fill-ink" : undefined}
            />
            <BotStoneFace
                face={face}
                fill_class={eye_fill}
                stroke_class={eye_stroke}
            />
        </svg>
    );
}

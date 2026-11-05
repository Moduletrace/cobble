import { twMerge } from "tailwind-merge";
import type { BotFace, BotStoneShape } from "@/src/dict/bot-dict";
import {
    CoordinatorBodyPath,
    StoneBodyPaths,
    StoneViewBox,
} from "@/src/data/stone-geometry";
import { botColorNeedsPaperFace, resolveBotStone } from "@/src/utils/bot-color";
import BotStoneFace from "./bot-stone-face";

/**
 * How the whole stone moves for each face (`--animate-stone-body-*` in
 * `main.css`). Only transforms: the outline and its one flat cut are never
 * redrawn. The eyes move on top of this (`BotStoneFace`).
 */
const BodyMotionClasses: Record<BotFace, string> = {
    idle: "animate-stone-body-idle",
    working: "animate-stone-body-working",
    done: "animate-stone-body-done",
    asleep: "animate-stone-body-asleep",
    "needs-you": "animate-stone-body-needs-you",
};

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
    /**
     * Leave the eyes still. Every face moves by default (`BotStoneFace`);
     * the logo and other static marks pass this.
     */
    still?: boolean;
    className?: string;
};

/**
 * # Bot Stone
 * @description A Cobble bot avatar: a stone with exactly one flat cut and two
 * eyes. Never put it in a circle, ring or badge, or add an outline or shadow.
 * The stone and its eyes move with its face unless `still`; it may hop a
 * little past its box, so it draws `overflow-visible`.
 */
export default function BotStone({
    color,
    stone,
    hue,
    face = "idle",
    size = 32,
    label,
    still,
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
    /**
     * The same bot always blinks at the same pace; different bots rarely
     * share one.
     */
    const motion_seed = [...`${color || ""}${stone || hue || ""}`].reduce(
        (sum, char) => sum + char.charCodeAt(0),
        0,
    );

    return (
        <svg
            width={size}
            height={size}
            viewBox={StoneViewBox}
            role={label ? "img" : undefined}
            aria-label={label || undefined}
            aria-hidden={label ? undefined : true}
            className={twMerge(
                "shrink-0",
                !still && "overflow-visible",
                className,
            )}
        >
            <g
                className={twMerge(
                    "origin-bottom transform-fill",
                    !still && BodyMotionClasses[face],
                    "motion-reduce:animate-none",
                )}
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
                    still={still}
                    motion_seed={motion_seed}
                />
            </g>
        </svg>
    );
}

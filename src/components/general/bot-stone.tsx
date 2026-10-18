import { twMerge } from "tailwind-merge";
import type { BotFace, BotHue } from "@/src/dict/bot-dict";
import { BotHueFillClasses } from "@/src/dict/bot-hue-classes-dict";
import {
    CoordinatorBodyPath,
    StoneBodyPaths,
    StoneViewBox,
} from "@/src/data/stone-geometry";
import BotStoneFace from "./bot-stone-face";

type Props = {
    /**
     * The bot's identity hue. Omit (or `null`) for the coordinator, which
     * renders hue-less: ink body, paper eyes, inverted in dark mode.
     */
    hue?: BotHue | null;
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
    hue,
    face = "idle",
    size = 32,
    label,
    className,
}: Props) {
    const is_coordinator = !hue;
    const body_path = hue ? StoneBodyPaths[hue] : CoordinatorBodyPath;
    const body_class = hue ? BotHueFillClasses[hue] : "fill-ink";
    const eye_fill = is_coordinator ? "fill-paper" : "fill-dark";
    const eye_stroke = is_coordinator ? "stroke-paper" : "stroke-dark";

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
            <path d={body_path} className={body_class} />
            <BotStoneFace
                face={face}
                fill_class={eye_fill}
                stroke_class={eye_stroke}
            />
        </svg>
    );
}

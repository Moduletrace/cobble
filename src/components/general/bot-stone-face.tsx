import { twMerge } from "tailwind-merge";
import type { BotFace } from "@/src/dict/bot-dict";
import BotStoneEyes from "./bot-stone-eyes";

/**
 * Idle blinks at three paces (`--animate-stone-blink-*` in `main.css`), so
 * stones side by side never blink in step. Literal class names, so Tailwind
 * sees them.
 */
const BlinkClasses = [
    "animate-stone-blink-a",
    "animate-stone-blink-b",
    "animate-stone-blink-c",
] as const;

const FaceMotionClasses: Record<Exclude<BotFace, "idle">, string> = {
    working: "animate-stone-glance",
    done: "animate-stone-hop",
    asleep: "animate-stone-breathe",
    "needs-you": "animate-stone-nudge",
};

type Props = {
    face: BotFace;
    /**
     * Fill class for solid eyes.
     */
    fill_class: string;
    /**
     * Stroke class for arc eyes.
     */
    stroke_class: string;
    /**
     * Leave the eyes still (the logo, static marks).
     */
    still?: boolean;
    /**
     * Any whole number, the same for the same bot: picks its blink pace.
     */
    motion_seed?: number;
};

/**
 * The face is the status, and each face moves its own way: idle blinks,
 * working glances side to side, done hops once, asleep breathes, needs-you
 * nudges. Only the eyes move; reduced motion keeps them still.
 */
export default function BotStoneFace({
    face,
    fill_class,
    stroke_class,
    still,
    motion_seed = 0,
}: Props) {
    const motion_class =
        face === "idle" || !FaceMotionClasses[face]
            ? BlinkClasses[Math.abs(motion_seed) % BlinkClasses.length]
            : FaceMotionClasses[face];

    return (
        <g
            className={twMerge(
                "origin-center transform-fill",
                !still && motion_class,
                "motion-reduce:animate-none",
            )}
        >
            <BotStoneEyes
                face={face}
                fill_class={fill_class}
                stroke_class={stroke_class}
            />
        </g>
    );
}

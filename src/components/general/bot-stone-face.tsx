import type { BotFace } from "@/src/dict/bot-dict";
import { StoneEyes } from "@/src/data/stone-geometry";
import StoneEyeDot from "./stone-eye-dot";
import StoneEyeLidded from "./stone-eye-lidded";
import StoneEyeArc from "./stone-eye-arc";
import StoneEyeFlat from "./stone-eye-flat";

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
};

/**
 * The face is the status. Geometry follows the handoff face states:
 * idle dots, working half-lidded, done upward arcs, asleep one flattened
 * dot, needs-you dot plus arc.
 */
export default function BotStoneFace({ face, fill_class, stroke_class }: Props) {
    const { left, right, centre } = StoneEyes;

    switch (face) {
        case "working":
            return (
                <>
                    <StoneEyeLidded {...left} className={fill_class} />
                    <StoneEyeLidded {...right} className={fill_class} />
                </>
            );
        case "done":
            return (
                <>
                    <StoneEyeArc {...left} className={stroke_class} />
                    <StoneEyeArc {...right} className={stroke_class} />
                </>
            );
        case "asleep":
            return <StoneEyeFlat {...centre} className={fill_class} />;
        case "needs-you":
            return (
                <>
                    <StoneEyeDot {...left} className={fill_class} />
                    <StoneEyeArc {...right} className={stroke_class} />
                </>
            );
        default:
            return (
                <>
                    <StoneEyeDot {...left} className={fill_class} />
                    <StoneEyeDot {...right} className={fill_class} />
                </>
            );
    }
}

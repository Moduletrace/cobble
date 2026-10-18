import { StoneEyes } from "@/src/data/stone-geometry";

type Props = {
    cx: number;
    cy: number;
    className?: string;
};

/**
 * Upward arc eye, drawn as a stroke in the eye colour.
 */
export default function StoneEyeArc({ cx, cy, className }: Props) {
    const r = StoneEyes.radius;
    const base = cy + r * 0.4;

    return (
        <path
            d={`M ${cx - r} ${base} A ${r} ${r} 0 0 1 ${cx + r} ${base}`}
            fill="none"
            strokeWidth={2.6}
            strokeLinecap="round"
            className={className}
        />
    );
}

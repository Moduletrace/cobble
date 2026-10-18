import { StoneEyes } from "@/src/data/stone-geometry";

type Props = {
    cx: number;
    cy: number;
    className?: string;
};

/**
 * Half-lidded eye: the lower half of the dot, flat edge on top.
 */
export default function StoneEyeLidded({ cx, cy, className }: Props) {
    const r = StoneEyes.radius;

    return (
        <path
            d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 0 ${cx + r} ${cy} Z`}
            className={className}
        />
    );
}

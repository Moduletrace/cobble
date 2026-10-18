import { StoneEyes } from "@/src/data/stone-geometry";

type Props = {
    cx: number;
    cy: number;
    className?: string;
};

/**
 * Flattened dot, used once and centred for the asleep face.
 */
export default function StoneEyeFlat({ cx, cy, className }: Props) {
    return (
        <ellipse
            cx={cx}
            cy={cy}
            rx={StoneEyes.radius + 1}
            ry={1.8}
            className={className}
        />
    );
}

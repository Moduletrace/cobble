import { StoneEyes } from "@/src/data/stone-geometry";

type Props = {
    cx: number;
    cy: number;
    className?: string;
};

export default function StoneEyeDot({ cx, cy, className }: Props) {
    return <circle cx={cx} cy={cy} r={StoneEyes.radius} className={className} />;
}

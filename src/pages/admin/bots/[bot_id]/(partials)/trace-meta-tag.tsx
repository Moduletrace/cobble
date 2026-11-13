import type { ReactNode } from "react";
import Tag from "@moduletrace/twui/elements/Tag";
import type { TWUIButtonColorType } from "@moduletrace/twui/layout/Button";
import { twMerge } from "tailwind-merge";

type Props = {
    children: ReactNode;
    color?: TWUIButtonColorType;
};

/**
 * One of the small values a trace entry shows beside its title (the model,
 * how long it took, how many images a call returned).
 */
export default function TraceMetaTag({ children, color = "gray" }: Props) {
    return (
        <Tag
            color={color}
            variant="outlined"
            className={twMerge("shrink-0 text-[11px] leading-4 whitespace-nowrap")}
        >
            {children}
        </Tag>
    );
}
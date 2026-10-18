import type { ComponentProps } from "react";
import { twMerge } from "tailwind-merge";

type Props = {
    icon_size?: number;
    img_props?: Pick<ComponentProps<"svg">, "className">;
};

export default function LogoIcon({ icon_size = 40, img_props }: Props) {
    return (
        <svg
            width={icon_size}
            height={icon_size}
            viewBox="0 0 512 512"
            role="img"
            aria-label="Logo Icon"
            className={twMerge("shrink-0", img_props?.className)}
        >
            <rect
                x="16"
                y="16"
                width="480"
                height="480"
                rx="120"
                className="fill-slate-900 dark:fill-slate-800"
            />
            <path
                d="M290 100 L144 286 H244 L222 412 L368 226 H268 Z"
                strokeWidth="28"
                strokeLinejoin="round"
                className="fill-white stroke-white"
            />
        </svg>
    );
}

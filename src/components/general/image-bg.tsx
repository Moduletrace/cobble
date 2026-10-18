import Img from "@moduletrace/twui/layout/Img";
import type { ComponentProps } from "react";
import { twMerge } from "tailwind-merge";

type Props = {
    src: string;
    img_props?: Omit<ComponentProps<typeof Img>, "alt">;
};

export default function ImageBG({ src, img_props }: Props) {
    return (
        <Img
            {...img_props}
            alt="bg image"
            src={src}
            className={twMerge(
                `absolute top-0 left-0 w-full h-full object-cover`,
                "z-0",
                img_props?.className,
            )}
        />
    );
}

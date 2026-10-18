import Img from "@moduletrace/twui/layout/Img";
import { twMerge } from "tailwind-merge";

type Props = {
    src: string;
    opacity?: number;
};

export default function BlurredImageBG({ src, opacity = 0.1 }: Props) {
    /**
     * Render component
     */
    return (
        <Img
            alt="bg image"
            src={src}
            className={twMerge(
                `absolute top-0 left-0 w-[150vw] h-full blur-xs object-cover`,
                "z-0",
            )}
            style={{ opacity }}
        />
    );
}

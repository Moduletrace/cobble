import Img from "@moduletrace/twui/layout/Img";
import { twMerge } from "tailwind-merge";
import Stack from "@moduletrace/twui/layout/Stack";

type Props = {
    src: string;
    width?: number;
    height?: number;
    alt?: string;
};

export default function RectImage({
    src,
    height = 300,
    width = 200,
    alt,
}: Props) {
    const img_component = (
        <Img
            alt={alt || "image"}
            src={src}
            className={twMerge(`w-full h-full object-cover`)}
        />
    );

    return (
        <>
            <Stack
                className={twMerge(`overflow-hidden hidden xl:flex`)}
                style={{
                    width: `${width}px`,
                    height: `${height}px`,
                }}
            >
                {img_component}
            </Stack>
            <Stack className={twMerge(`overflow-hidden flex xl:hidden w-full`)}>
                {img_component}
            </Stack>
        </>
    );
}

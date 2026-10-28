import Img from "@moduletrace/twui/layout/Img";
import Span from "@moduletrace/twui/layout/Span";
import { twMerge } from "tailwind-merge";
import type { PwaInstallIconMode } from "@/src/data/pwa-data";

type Props = {
    /**
     * `circle` is a round launcher, which keeps only the centre 80% of
     * the maskable icon (so the content is drawn 125% and cropped);
     * `rounded` is the plain icon with rounded corners.
     */
    shape: "circle" | "rounded";
    mode: PwaInstallIconMode;
    stone: string;
    mark: boolean;
    image_src?: string | null;
    className?: string;
};

/**
 * The app icon as a launcher would show it, laid out like the generated
 * files (`renderInstallIcons`): a stone at 52% (maskable) or 80% on paper,
 * or the image with the stone in the top-left: 20% in at 22% of the side
 * (maskable, round), 16% in at 30% (rounded square).
 */
export default function InstallIconShape({ shape, mode, stone, mark, image_src, className }: Props) {
    const stone_src = `/brand/icons/${stone}.svg`;

    return (
        <Span
            className={twMerge(
                "relative block size-24 shrink-0 overflow-hidden bg-paper border border-solid border-hairline",
                shape == "circle" ? "rounded-full" : "rounded-[22%]",
                className,
            )}
        >
            <Span className={twMerge("absolute inset-0 block", shape == "circle" && "scale-125")}>
                {mode == "image" && image_src ? (
                    <>
                        <Img src={image_src} alt="" className="absolute inset-0 size-full object-cover" />
                        {mark ? (
                            <Img
                                src={stone_src}
                                alt=""
                                className={twMerge(
                                    "absolute",
                                    shape == "circle"
                                        ? "left-[20%] top-[20%] size-[22%]"
                                        : "left-[16%] top-[16%] size-[30%]",
                                )}
                            />
                        ) : null}
                    </>
                ) : (
                    <Img
                        src={stone_src}
                        alt=""
                        className={twMerge(
                            "absolute inset-0 m-auto",
                            shape == "circle" ? "size-[52%]" : "size-[80%]",
                        )}
                    />
                )}
            </Span>
        </Span>
    );
}

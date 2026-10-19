import Img from "@moduletrace/twui/layout/Img";
import Span from "@moduletrace/twui/layout/Span";
import { twMerge } from "tailwind-merge";

/**
 * Round avatar sizes, each with the type scale for its initials.
 */
const UserAvatarSizeClasses = {
    sm: "size-6 text-[11px]",
    md: "size-8 text-xs",
    lg: "size-16 text-lg",
} as const;

type Props = {
    src?: string;
    /**
     * Tried when `src` fails to load, e.g. a full image behind a thumbnail.
     */
    img_err_src?: string;
    initials: string;
    alt?: string;
    size?: keyof typeof UserAvatarSizeClasses;
    className?: string;
};

/**
 * A user's round photo, or their initials on sunken paper when there is none.
 */
export default function UserAvatar({
    src,
    img_err_src,
    initials,
    alt = "",
    size = "md",
    className,
}: Props) {
    const base_class = twMerge(
        "shrink-0 rounded-full bg-sunken",
        UserAvatarSizeClasses[size],
        src
            ? "object-cover"
            : "flex items-center justify-center font-bold leading-none text-ink",
        className,
    );

    if (src) {
        return (
            <Img
                src={src}
                imgErrSrc={img_err_src}
                alt={alt}
                className={base_class}
            />
        );
    }

    return (
        <Span className={base_class} aria-hidden>
            {initials || "?"}
        </Span>
    );
}

import grabMediaURL from "@/src/functions/backend/media/grab-media-url";
import type { BUN_SQLITE_COBBLE_USERS_JOIN } from "@/src/types/sql-joins";
import userInitials from "@/src/utils/user-initials";
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
    /**
     * Their photo and initials come from this user (`grabUsers`' row, with
     * `profile_media_id`), unless `src` or `initials` are given.
     */
    person?: BUN_SQLITE_COBBLE_USERS_JOIN | null;
    /**
     * A photo to show instead, e.g. one just picked and not saved yet.
     */
    src?: string;
    /**
     * Tried when `src` fails to load, e.g. a full image behind a thumbnail.
     */
    img_err_src?: string;
    initials?: string;
    alt?: string;
    size?: keyof typeof UserAvatarSizeClasses;
    className?: string;
};

/**
 * A user's round photo (its thumbnail, the full image if that fails), or
 * their initials on sunken paper when there is none.
 */
export default function UserAvatar({
    person,
    src: passed_src,
    img_err_src: passed_err_src,
    initials: passed_initials,
    alt = "",
    size = "md",
    className,
}: Props) {
    const photo = person?.profile_media_id ? grabMediaURL({ user: person }) : {};
    const src = passed_src || photo.media_thumbnail_url || photo.media_url;
    const img_err_src = passed_src ? passed_err_src : photo.media_url;
    const initials = passed_initials || userInitials(person || {});

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

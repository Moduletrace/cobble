import type { ComponentProps } from "react";
import Img from "@moduletrace/twui/layout/Img";
import { twMerge } from "tailwind-merge";
import profileImageUrls from "@/src/utils/profile-image-urls";
import BotStone from "./bot-stone";

/**
 * Picture sizes, matching the stone sizes in use.
 */
const BotAvatarSizeClasses: Record<number, string> = {
    18: "size-[18px] rounded-[4px]",
    28: "size-7 rounded-default-sm",
    32: "size-8 rounded-default-sm",
    40: "size-10 rounded-default",
    56: "size-14 rounded-default",
};

type Props = ComponentProps<typeof BotStone> & {
    /**
     * The bot's custom picture, shown instead of the stone.
     */
    image_media_id?: number | string | null;
    /**
     * A picture to show instead, e.g. one just picked and not saved yet.
     */
    src?: string;
};

/**
 * A bot's avatar: its custom picture when it has one (a rounded square,
 * never a circle, so it isn't mistaken for a person), else its stone. Its
 * colour still marks it everywhere else, e.g. the unread dot.
 */
export default function BotAvatar({ image_media_id, src: picked, ...stone }: Props) {
    const saved = profileImageUrls({ media_id: image_media_id });
    const thumbnail_src = picked || saved.thumbnail_src;
    const src = picked || saved.src;
    const size = stone.size || 32;

    if (!thumbnail_src) return <BotStone {...stone} />;

    return (
        <Img
            src={thumbnail_src}
            imgErrSrc={src}
            alt={stone.label || ""}
            className={twMerge(
                "shrink-0 object-cover bg-sunken",
                BotAvatarSizeClasses[size] || BotAvatarSizeClasses[32],
                stone.className,
            )}
        />
    );
}

import Img from "@moduletrace/twui/layout/Img";
import Span from "@moduletrace/twui/layout/Span";
import { Layers } from "lucide-react";
import { twMerge } from "tailwind-merge";
import profileImageUrls from "@/src/utils/profile-image-urls";

const WorkspaceAvatarSizes = {
    sm: { box: "size-8 rounded-default-sm", icon: 16 },
    lg: { box: "size-14 rounded-default", icon: 24 },
} as const;

type Props = {
    image_media_id?: number | string | null;
    /**
     * A picture to show instead, e.g. one just picked and not saved yet.
     */
    src?: string;
    size?: keyof typeof WorkspaceAvatarSizes;
    className?: string;
};

/**
 * A workspace's picture, or the workspace icon on a tile when it has none.
 */
export default function WorkspaceAvatar({ image_media_id, src: picked, size = "sm", className }: Props) {
    const saved = profileImageUrls({ media_id: image_media_id });
    const thumbnail_src = picked || saved.thumbnail_src;
    const src = picked || saved.src;
    const { box, icon } = WorkspaceAvatarSizes[size];

    if (thumbnail_src) {
        return (
            <Img
                src={thumbnail_src}
                imgErrSrc={src}
                alt=""
                className={twMerge("shrink-0 object-cover bg-sunken", box, className)}
            />
        );
    }

    return (
        <Span
            aria-hidden
            className={twMerge(
                "shrink-0 flex items-center justify-center border border-solid border-hairline bg-surface text-ink",
                box,
                className,
            )}
        >
            <Layers size={icon} aria-hidden />
        </Span>
    );
}

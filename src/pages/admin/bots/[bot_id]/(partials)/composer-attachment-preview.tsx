import Img from "@moduletrace/twui/layout/Img";

type Props = {
    src: string;
};

/**
 * A picked image's preview, the size of the icon it stands in for.
 */
export default function ComposerAttachmentPreview({ src }: Props) {
    return (
        <Img
            src={src}
            alt=""
            className="size-7 shrink-0 rounded-sm object-cover"
        />
    );
}

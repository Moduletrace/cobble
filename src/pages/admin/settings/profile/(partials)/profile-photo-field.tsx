import { useRef } from "react";
import Row from "@moduletrace/twui/layout/Row";
import Stack from "@moduletrace/twui/layout/Stack";
import Span from "@moduletrace/twui/layout/Span";
import Button from "@moduletrace/twui/layout/Button";
import imageInputToBase64, {
    type ImageInputToBase64FunctionReturn,
} from "@moduletrace/twui/utils/form/imageInputToBase64";
import UserAvatar from "@/src/components/general/user-avatar";

type Props = {
    saved_src?: string;
    initials: string;
    image?: ImageInputToBase64FunctionReturn;
    setImage: (image?: ImageInputToBase64FunctionReturn) => void;
    disabled?: boolean;
};

/**
 * Photo preview with a single upload button. A picked photo previews right
 * away and is saved with the rest of the form.
 */
export default function ProfilePhotoField({
    saved_src,
    initials,
    image,
    setImage,
    disabled,
}: Props) {
    const input_ref = useRef<HTMLInputElement>(null);
    const preview_src = image?.imageBase64Full || saved_src;

    return (
        <Row className="w-full gap-4! flex-nowrap items-center">
            <UserAvatar
                src={preview_src}
                initials={initials}
                alt="Your photo"
                size="lg"
            />
            <Stack className="gap-2! min-w-0">
                <Row className="gap-2!">
                    <Button
                        title={preview_src ? "Change photo" : "Upload photo"}
                        type="button"
                        variant="outlined"
                        color="gray"
                        size="small"
                        disabled={disabled}
                        onClick={() => input_ref.current?.click()}
                    >
                        {preview_src ? "Change photo" : "Upload photo"}
                    </Button>
                    {image ? (
                        <Button
                            title="Keep the current photo"
                            type="button"
                            variant="ghost"
                            color="gray"
                            size="small"
                            disabled={disabled}
                            onClick={() => {
                                setImage(undefined);
                                if (input_ref.current) {
                                    input_ref.current.value = "";
                                }
                            }}
                        >
                            Cancel
                        </Button>
                    ) : null}
                </Row>
                <Span className="text-[13px] leading-[18px] text-ink-secondary">
                    PNG or JPG. A square photo looks best.
                </Span>
            </Stack>
            {/*
             * Raw on purpose: twui `Input` writes `value` on change, which
             * browsers forbid on file inputs, and `ImageUpload` /
             * `FileUpload` are full card widgets. This is only the hidden
             * picker behind the button above.
             */}
            <input
                ref={input_ref}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="hidden"
                tabIndex={-1}
                aria-hidden
                onChange={(e) => {
                    if (!e.target.files?.[0]) return;
                    imageInputToBase64({ imageInput: e.target }).then((res) =>
                        setImage(res),
                    );
                }}
            />
        </Row>
    );
}

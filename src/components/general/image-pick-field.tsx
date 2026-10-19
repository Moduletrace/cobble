import { useRef, type ReactNode } from "react";
import Button from "@moduletrace/twui/layout/Button";
import Row from "@moduletrace/twui/layout/Row";
import Span from "@moduletrace/twui/layout/Span";
import Stack from "@moduletrace/twui/layout/Stack";
import imageInputToBase64 from "@moduletrace/twui/utils/form/imageInputToBase64";

type Props = {
    /**
     * The avatar as it looks now (or will, with the picked picture).
     */
    preview: ReactNode;
    has_image: boolean;
    onPick: (params: { data_url: string }) => void;
    onRemove: () => void;
    loading?: boolean;
    disabled?: boolean;
    note?: string;
};

/**
 * An avatar preview with Upload/Change and Remove. The picked picture comes
 * back as a data URL; saving is up to the caller.
 */
export default function ImagePickField({
    preview,
    has_image,
    onPick,
    onRemove,
    loading,
    disabled,
    note = "PNG, JPG or WebP. A square picture looks best.",
}: Props) {
    const input_ref = useRef<HTMLInputElement>(null);

    return (
        <Row className="w-full gap-4! flex-nowrap items-center">
            {preview}
            <Stack className="gap-2! min-w-0">
                <Row className="gap-2!">
                    <Button
                        title={has_image ? "Change picture" : "Upload picture"}
                        type="button"
                        variant="outlined"
                        color="gray"
                        size="small"
                        loading={loading}
                        disabled={disabled || loading}
                        onClick={() => input_ref.current?.click()}
                    >
                        {has_image ? "Change picture" : "Upload picture"}
                    </Button>
                    {has_image ? (
                        <Button
                            title="Remove the picture"
                            type="button"
                            variant="ghost"
                            color="gray"
                            size="small"
                            disabled={disabled || loading}
                            onClick={() => {
                                onRemove();
                                if (input_ref.current) input_ref.current.value = "";
                            }}
                        >
                            Remove
                        </Button>
                    ) : null}
                </Row>
                <Span className="text-[13px] leading-[18px] text-ink-secondary">{note}</Span>
            </Stack>
            {/*
             * Raw on purpose: twui `Input` writes `value` on change, which
             * browsers forbid on file inputs, and `ImageUpload` is a full
             * card widget. This is only the hidden picker behind the button.
             */}
            <input
                ref={input_ref}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif"
                className="hidden"
                tabIndex={-1}
                aria-hidden
                onChange={(e) => {
                    if (!e.target.files?.[0]) return;

                    imageInputToBase64({ imageInput: e.target }).then((res) => {
                        if (res?.imageBase64Full) onPick({ data_url: res.imageBase64Full });
                    });
                }}
            />
        </Row>
    );
}

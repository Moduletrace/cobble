import Row from "@moduletrace/twui/layout/Row";
import Span from "@moduletrace/twui/layout/Span";
import Stack from "@moduletrace/twui/layout/Stack";
import type { ComponentProps } from "react";
import InstallIconShape from "./install-icon-shape";

type Props = Omit<ComponentProps<typeof InstallIconShape>, "shape" | "className">;

/**
 * The icon in the two crops launchers use, before it's saved.
 */
export default function InstallIconPreview(props: Props) {
    return (
        <Stack className="w-full gap-2! items-start">
            <Span className="text-sm font-bold leading-5 text-ink">Preview</Span>
            <Row className="gap-6! items-end">
                <Stack className="gap-2! items-center">
                    <InstallIconShape shape="circle" {...props} />
                    <Span className="text-[13px] leading-[18px] text-ink-secondary">Round</Span>
                </Stack>
                <Stack className="gap-2! items-center">
                    <InstallIconShape shape="rounded" {...props} />
                    <Span className="text-[13px] leading-[18px] text-ink-secondary">Rounded square</Span>
                </Stack>
            </Row>
        </Stack>
    );
}

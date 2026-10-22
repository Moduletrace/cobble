import Row from "@moduletrace/twui/layout/Row";
import type Span from "@moduletrace/twui/layout/Span";
import type { ComponentProps } from "react";
import { twMerge } from "tailwind-merge";
import Stack from "@moduletrace/twui/layout/Stack";
import LogoIcon from "./logo-icon";
import Wordmark from "./wordmark";

type Props = {
    icon_size?: number;
    text_wrapper_props?: ComponentProps<typeof Stack>;
    /**
     * Only `className` applies: it sets the wordmark colour.
     */
    text_props?: ComponentProps<typeof Span>;
    no_link?: boolean;
};

/**
 * Horizontal lockup: the ember stone beside the `cobble` wordmark.
 */
export default function Logo({
    icon_size = 36,
    text_props,
    text_wrapper_props,
    no_link,
}: Props) {
    const content = (
        <Row className="gap-2.5! flex-nowrap items-center">
            <LogoIcon icon_size={icon_size} />
            <Stack
                {...text_wrapper_props}
                className={twMerge("gap-0!", text_wrapper_props?.className)}
            >
                <Wordmark
                    height={Math.round(icon_size * 0.5)}
                    className={text_props?.className}
                />
            </Stack>
        </Row>
    );

    if (no_link) {
        return content;
    }

    return (
        <a href="/" className="logo-link">
            {content}
        </a>
    );
}

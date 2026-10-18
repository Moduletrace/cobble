import Row from "@moduletrace/twui/layout/Row";
import Span from "@moduletrace/twui/layout/Span";
import type { ComponentProps, PropsWithChildren } from "react";
import { twMerge } from "tailwind-merge";
import Stack from "@moduletrace/twui/layout/Stack";
import LogoIcon from "./logo-icon";
import { SiteData } from "@/src/data/site-data";

type Props = {
    icon_size?: number;
    text_wrapper_props?: ComponentProps<typeof Stack>;
    text_props?: ComponentProps<typeof Span>;
};

export default function Logo({
    icon_size = 36,
    text_props,
    text_wrapper_props,
}: Props) {
    return (
        <a href="/" className="logo-link">
            <Row className="gap-3! flex-nowrap items-center">
                <LogoIcon icon_size={icon_size} />
                <Stack
                    {...text_wrapper_props}
                    className={twMerge("gap-1!", text_wrapper_props?.className)}
                >
                    <Stack className="gap-0!">
                        <HeroText text_props={text_props}>
                            {SiteData["SiteName"]}
                        </HeroText>
                    </Stack>
                </Stack>
            </Row>
        </a>
    );
}

function HeroText({
    text_props,
    children,
}: PropsWithChildren & {
    text_props?: ComponentProps<typeof Span>;
}) {
    return (
        <Span
            {...text_props}
            className={twMerge(
                "text-[17px] font-semibold tracking-tight text-dark dark:text-white heading leading-[24px] whitespace-nowrap",
                text_props?.className,
            )}
        >
            {children}
        </Span>
    );
}
import React, { type ComponentProps, type ReactNode } from "react";
import Container from "@moduletrace/twui/layout/Container";
import H1 from "@moduletrace/twui/layout/H1";
import P from "@moduletrace/twui/layout/P";
import Section from "@moduletrace/twui/layout/Section";
import Span from "@moduletrace/twui/layout/Span";
import type Img from "@moduletrace/twui/layout/Img";
import { SiteData } from "@/src/data/site-data";

type Props = {
    title: string;
    image_url?: string;
    sub_title?: string;
    cta_buttons?: ReactNode;
    img_props?: Omit<ComponentProps<typeof Img>, "alt">;
    img_component?: ReactNode;
};

export default function MainHeroSection({
    title,
    cta_buttons,
    sub_title,
}: Props) {
    return (
        <Section className="mt-hero-section">
            <Container className="mt-container flex-col! gap-0">
                <Span className="htag">{SiteData["SiteName"]}</Span>
                <H1 className="mt-hero-title">{title}</H1>
                {sub_title ? (
                    <P className="mt-hero-desc">{sub_title}</P>
                ) : null}
                {cta_buttons ? (
                    <div className="mt-hero-ctas">{cta_buttons}</div>
                ) : null}
            </Container>
        </Section>
    );
}
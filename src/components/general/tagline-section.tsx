import Section from "@moduletrace/twui/layout/Section";
import Container from "@moduletrace/twui/layout/Container";
import H2 from "@moduletrace/twui/layout/H2";
import Stack from "@moduletrace/twui/layout/Stack";
import type { TWUILucideIconName } from "@moduletrace/twui/elements/lucide-icon";
import LucideIcon from "@moduletrace/twui/elements/lucide-icon";
import Span from "@moduletrace/twui/layout/Span";
import type { ReactNode } from "react";

type Props = {
    tagline: string;
    icon_name?: TWUILucideIconName;
    sub_title?: string;
    post_component?: ReactNode;
};

export default function TaglineSection({
    tagline,
    icon_name,
    sub_title,
    post_component,
}: Props) {
    /**
     * Render component
     */
    return (
        <Section className="bg-secondary relative">
            <Container className="xl:py-10">
                <Stack className="w-full items-center gap-6">
                    {icon_name && (
                        <LucideIcon
                            name={icon_name}
                            size={50}
                            className="text-accent"
                        />
                    )}
                    <H2 className="text-center max-w-4xl xl:text-6xl! text-white">
                        {tagline}
                    </H2>
                    {sub_title ? (
                        <Span
                            className="text-white/80 max-w-4xl text-center"
                            size="larger"
                        >
                            {sub_title}
                        </Span>
                    ) : null}
                    {post_component}
                </Stack>
            </Container>
        </Section>
    );
}

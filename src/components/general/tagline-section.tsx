import Section from "@moduletrace/twui/layout/Section";
import Container from "@moduletrace/twui/layout/Container";
import H2 from "@moduletrace/twui/layout/H2";
import Stack from "@moduletrace/twui/layout/Stack";
import type { LucideIcon } from "lucide-react";
import Span from "@moduletrace/twui/layout/Span";
import type { ReactNode } from "react";

type Props = {
    tagline: string;
    icon?: LucideIcon;
    sub_title?: string;
    post_component?: ReactNode;
};

export default function TaglineSection({
    tagline,
    icon: Icon,
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
                    {Icon && <Icon size={50} className="text-accent" />}
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

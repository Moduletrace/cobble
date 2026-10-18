import Section from "@moduletrace/twui/layout/Section";
import Container from "@moduletrace/twui/layout/Container";
import Stack from "@moduletrace/twui/layout/Stack";
import H1 from "@moduletrace/twui/layout/H1";
import Span from "@moduletrace/twui/layout/Span";

type Props = {
    title: string;
    sub_title?: string;
    description?: string;
};

export default function InnerPageHeroSection({
    title,
    description,
    sub_title,
}: Props) {
    return (
        <Section className="border-b border-slate-200/60 dark:border-white/10">
            <Container>
                <Stack className="w-full items-center max-w-3xl mx-auto gap-6!">
                    {sub_title ? (
                        <Span className="htag">{sub_title}</Span>
                    ) : null}
                    <H1 className="text-center">{title}</H1>
                    {description ? (
                        <Span className="text-lg sm:text-xl leading-snug text-center text-slate-500 dark:text-slate-400">
                            {description}
                        </Span>
                    ) : null}
                </Stack>
            </Container>
        </Section>
    );
}
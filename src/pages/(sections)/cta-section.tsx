import Section from "@moduletrace/twui/layout/Section";
import Container from "@moduletrace/twui/layout/Container";
import Stack from "@moduletrace/twui/layout/Stack";
import Row from "@moduletrace/twui/layout/Row";
import H2 from "@moduletrace/twui/layout/H2";
import Span from "@moduletrace/twui/layout/Span";
import Button from "@moduletrace/twui/layout/Button";
import { ArrowRight } from "lucide-react";
import { useAuthStatus } from "@/src/hooks/use-auth-status";

export default function CTASection() {
    const { is_logged_in } = useAuthStatus();

    if (is_logged_in) {
        return null;
    }

    return (
        <Section className="pt-0!">
            <Container>
                <Row className="w-full items-end justify-between gap-10! rounded-default-xl bg-dark dark:bg-white/5 dark:ring-1 dark:ring-white/10 px-8 py-14 xl:px-16 xl:py-20">
                    <Stack className="gap-5! max-w-2xl">
                        <Span className="htag text-white/50!">Begin</Span>
                        <H2 className="text-white">
                            Start with a foundation that already feels{" "}
                            <Span className="text-white/40">
                                finished.
                            </Span>
                        </H2>
                    </Stack>
                    <Button
                        title="Get started"
                        color="white"
                        size="large"
                        href="/auth/signup"
                        afterIcon={<ArrowRight size={16} />}
                    >
                        Get started
                    </Button>
                </Row>
            </Container>
        </Section>
    );
}

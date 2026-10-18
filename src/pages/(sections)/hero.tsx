import Section from "@moduletrace/twui/layout/Section";
import Container from "@moduletrace/twui/layout/Container";
import Stack from "@moduletrace/twui/layout/Stack";
import Row from "@moduletrace/twui/layout/Row";
import Span from "@moduletrace/twui/layout/Span";
import H1 from "@moduletrace/twui/layout/H1";
import Button from "@moduletrace/twui/layout/Button";
import { ArrowRight } from "lucide-react";
import { useAuthStatus } from "@/src/hooks/use-auth-status";
import { HeroSpecs } from "../(data)/hero-specs";
import HeroSpecItem from "../(partials)/hero-spec-item";

export default function Hero() {
    const { is_logged_in } = useAuthStatus();

    return (
        <Section className="pt-20! pb-16! xl:pt-32! xl:pb-20! border-b border-slate-200/60 dark:border-white/10">
            <Container>
                <Stack className="w-full items-start gap-10!">
                    <Span className="htag">Bunext + SQLite preset</Span>
                    <H1 className="max-w-5xl">
                        Full-stack software, built in Bun.{" "}
                        <Span className="text-slate-400">
                            Shipped with intent.
                        </Span>
                    </H1>
                    <Row className="w-full items-end justify-between gap-10!">
                        <Span className="text-lg text-slate-600 dark:text-slate-400 leading-relaxed max-w-xl">
                            Routing, a schema-driven database, authentication
                            and a considered design system, assembled into one
                            starting point you can make your own.
                        </Span>
                        <Row className="flex-wrap items-center gap-3!">
                            {!is_logged_in ? (
                                <Button
                                    title="Get started"
                                    href="/auth/signup"
                                    size="large"
                                    afterIcon={<ArrowRight size={16} />}
                                >
                                    Get started
                                </Button>
                            ) : null}
                            <Button
                                title="Learn more"
                                variant="outlined"
                                color="gray"
                                size="large"
                                href="/about"
                            >
                                Learn more
                            </Button>
                        </Row>
                    </Row>
                    <div className="grid w-full grid-cols-2 lg:grid-cols-4 gap-x-6 mt-8">
                        {HeroSpecs.map((spec, index) => (
                            <HeroSpecItem
                                key={spec.label}
                                {...spec}
                                index={index}
                            />
                        ))}
                    </div>
                </Stack>
            </Container>
        </Section>
    );
}

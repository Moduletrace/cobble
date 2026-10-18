import Section from "@moduletrace/twui/layout/Section";
import Container from "@moduletrace/twui/layout/Container";
import Stack from "@moduletrace/twui/layout/Stack";
import H2 from "@moduletrace/twui/layout/H2";
import Span from "@moduletrace/twui/layout/Span";
import FeatureGrid from "@/src/components/general/feature-grid";
import { AboutItems } from "../(data)/about-items";

export default function AboutPresetSection() {
    return (
        <Section>
            <Container>
                <Stack className="w-full items-center gap-16!">
                    <Stack className="w-full items-center max-w-3xl mx-auto gap-4!">
                        <Span className="htag">About this template</Span>
                        <H2 className="text-center">
                            A deliberate starting point, not a blank canvas
                        </H2>
                        <Span className="text-center text-slate-500 dark:text-slate-400 max-w-2xl">
                            This preset ships the hard parts already solved -
                            server wiring, database tooling, authentication,
                            and a coherent design system - so you can jump
                            straight to building your product.
                        </Span>
                    </Stack>

                    <FeatureGrid items={AboutItems} />
                </Stack>
            </Container>
        </Section>
    );
}

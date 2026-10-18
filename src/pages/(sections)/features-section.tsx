import Section from "@moduletrace/twui/layout/Section";
import Container from "@moduletrace/twui/layout/Container";
import Stack from "@moduletrace/twui/layout/Stack";
import Row from "@moduletrace/twui/layout/Row";
import H2 from "@moduletrace/twui/layout/H2";
import Span from "@moduletrace/twui/layout/Span";
import { FeaturesArray } from "../(data)/features-data";
import FeatureGrid from "@/src/components/general/feature-grid";

export default function FeaturesSection() {
    return (
        <Section id="features">
            <Container>
                <Row className="w-full items-end justify-between gap-8! mb-14">
                    <Stack className="gap-6! max-w-2xl">
                        <Span className="htag">What's inside</Span>
                        <H2>
                            Everything considered, nothing superfluous.
                        </H2>
                    </Stack>
                    <Span className="text-slate-500 dark:text-slate-400 leading-relaxed max-w-sm">
                        Runtime, database, routing, auth and interface work
                        together from the first commit, so the decisions left
                        are the ones that matter to your product.
                    </Span>
                </Row>

                <FeatureGrid items={FeaturesArray} />
            </Container>
        </Section>
    );
}

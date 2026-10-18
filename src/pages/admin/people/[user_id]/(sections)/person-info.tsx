import Paper from "@moduletrace/twui/elements/Paper";
import H2 from "@moduletrace/twui/layout/H2";
import Row from "@moduletrace/twui/layout/Row";
import Section from "@moduletrace/twui/layout/Section";
import Span from "@moduletrace/twui/layout/Span";
import Stack from "@moduletrace/twui/layout/Stack";
import { AppContext } from "@/src/pages/__root";
import { useContext } from "react";

export default function PersonInfo() {
    const { pageProps } = useContext(AppContext);

    const person = pageProps?.person;

    if (!person) return null;

    const person_name = `${person.first_name + (person.last_name ? ` ${person.last_name}` : "")}`;

    return (
        <Section>
            <Row className="w-full grid xl:grid-cols-2">
                <Paper>
                    <Stack>
                        <H2>Biography</H2>
                        {person.bio ? (
                            <div
                                dangerouslySetInnerHTML={{ __html: person.bio }}
                                className="bio-content"
                            />
                        ) : (
                            <Span>No Bio</Span>
                        )}
                    </Stack>
                </Paper>
            </Row>
        </Section>
    );
}

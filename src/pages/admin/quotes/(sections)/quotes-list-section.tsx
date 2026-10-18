import Section from "@moduletrace/twui/layout/Section";
import Stack from "@moduletrace/twui/layout/Stack";
import QuotesList from "../(partials)/quotes-list";

export default function QuotesListSection() {
    return (
        <Section>
            <Stack className="w-full items-stretch">
                <QuotesList />
            </Stack>
        </Section>
    );
}
import Section from "@moduletrace/twui/layout/Section";
import Stack from "@moduletrace/twui/layout/Stack";
import LettersList from "../(partials)/letters-list";

export default function LettersListSection() {
    return (
        <Section>
            <Stack className="w-full items-stretch">
                <LettersList />
            </Stack>
        </Section>
    );
}
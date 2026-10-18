import Section from "@moduletrace/twui/layout/Section";
import Stack from "@moduletrace/twui/layout/Stack";
import PeopleList from "../(partials)/people-list";

export default function PeopleListSection() {
    return (
        <Section>
            <Stack className="w-full items-stretch">
                <PeopleList />
            </Stack>
        </Section>
    );
}

import Section from "@moduletrace/twui/layout/Section";
import Stack from "@moduletrace/twui/layout/Stack";
import LogsList from "../(partials)/logs-list";

export default function LogsListSection() {
    return (
        <Section>
            <Stack className="w-full items-stretch">
                <LogsList />
            </Stack>
        </Section>
    );
}

import Section from "@moduletrace/twui/layout/Section";
import Stack from "@moduletrace/twui/layout/Stack";
import EmailsList from "../(partials)/emails-list";

export default function EmailsListSection() {
    return (
        <Section>
            <Stack className="w-full items-stretch">
                <EmailsList />
            </Stack>
        </Section>
    );
}
import Section from "@moduletrace/twui/layout/Section";
import Stack from "@moduletrace/twui/layout/Stack";
import InvoicesList from "../(partials)/invoices-list";

export default function InvoicesListSection() {
    return (
        <Section>
            <Stack className="w-full items-stretch">
                <InvoicesList />
            </Stack>
        </Section>
    );
}
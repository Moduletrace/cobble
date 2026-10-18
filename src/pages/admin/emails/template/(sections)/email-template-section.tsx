import Paper from "@moduletrace/twui/elements/Paper";
import Center from "@moduletrace/twui/layout/Center";
import Section from "@moduletrace/twui/layout/Section";
import Span from "@moduletrace/twui/layout/Span";
import Stack from "@moduletrace/twui/layout/Stack";
import { AppContext } from "@/src/pages/__root";
import { useContext } from "react";
import EmailTemplatePreview from "../(partials)/email-template-preview";

export default function EmailTemplateSection() {
    const { pageProps } = useContext(AppContext);

    const html = pageProps?.email_template_html;

    if (!html) {
        return (
            <Section>
                <Paper>
                    <Center className="p-20">
                        <Span>Failed to render email template.</Span>
                    </Center>
                </Paper>
            </Section>
        );
    }

    return (
        <Section>
            <Stack className="w-full items-stretch">
                <EmailTemplatePreview srcDoc={html} />
            </Stack>
        </Section>
    );
}

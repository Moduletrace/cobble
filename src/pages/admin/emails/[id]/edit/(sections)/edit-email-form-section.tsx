import Section from "@moduletrace/twui/layout/Section";
import { AppContext } from "@/src/pages/__root";
import { useContext } from "react";
import EmailForm from "../../../create/(partials)/email-form";

export default function EditEmailFormSection() {
    const { pageProps } = useContext(AppContext);

    const email = pageProps?.email;

    if (!email) return null;

    return (
        <Section>
            <EmailForm existing_email={email} />
        </Section>
    );
}
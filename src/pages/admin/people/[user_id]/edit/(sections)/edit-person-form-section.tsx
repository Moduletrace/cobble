import Section from "@moduletrace/twui/layout/Section";
import { AppContext } from "@/src/pages/__root";
import { useContext } from "react";
import UserForm from "../../../create/(partials)/user-form";

export default function EditPersonFormSection() {
    const { pageProps } = useContext(AppContext);

    const person = pageProps?.person;

    if (!person) return null;

    return (
        <Section>
            <UserForm person={person} />
        </Section>
    );
}

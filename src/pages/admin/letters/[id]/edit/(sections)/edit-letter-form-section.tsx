import Section from "@moduletrace/twui/layout/Section";
import { AppContext } from "@/src/pages/__root";
import { useContext } from "react";
import LetterForm from "../../../create/(partials)/letter-form";

export default function EditLetterFormSection() {
    const { pageProps } = useContext(AppContext);

    const letter = pageProps?.letter;

    if (!letter) return null;

    return (
        <Section>
            <LetterForm existing_letter={letter} />
        </Section>
    );
}
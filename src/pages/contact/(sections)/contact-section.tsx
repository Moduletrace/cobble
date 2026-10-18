import Section from "@moduletrace/twui/layout/Section";
import Container from "@moduletrace/twui/layout/Container";
import ContactInfo from "../(partials)/contact-info";
import ContactForm from "../(partials)/contact-form";

export default function ContactSection() {
    return (
        <Section className="pt-20! xl:pt-32!">
            <Container>
                <div className="grid w-full grid-cols-1 xl:grid-cols-[1fr_minmax(0,560px)] items-start gap-16 xl:gap-24">
                    <ContactInfo />
                    <ContactForm />
                </div>
            </Container>
        </Section>
    );
}

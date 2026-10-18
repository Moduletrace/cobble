import Section from "@moduletrace/twui/layout/Section";
import Container from "@moduletrace/twui/layout/Container";
import Stack from "@moduletrace/twui/layout/Stack";
import AuthHero from "@/src/components/general/auth-hero";
import { SiteData } from "@/src/data/site-data";
import SignupForm from "../(partials)/signup-form";

/**
 * First-run setup. Only reachable while no account exists.
 */
export default function SignupFormSection() {
    return (
        <Section>
            <Container>
                <Stack className="w-full items-center max-w-md mx-auto gap-8">
                    <AuthHero
                        eyebrow="Set up"
                        title="Create the super admin"
                        description={`This is the first account on this ${SiteData["SiteName"]} install. It can add everyone else.`}
                    />
                    <SignupForm />
                </Stack>
            </Container>
        </Section>
    );
}

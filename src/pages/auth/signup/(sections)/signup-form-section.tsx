import Section from "@moduletrace/twui/layout/Section";
import Container from "@moduletrace/twui/layout/Container";
import Stack from "@moduletrace/twui/layout/Stack";
import AuthHero from "@/src/components/general/auth-hero";
import AuthFooterLink from "@/src/components/general/auth-footer-link";
import { SiteData } from "@/src/data/site-data";
import SignupForm from "../(partials)/signup-form";
import useLoginMethod from "@/src/hooks/use-login-method";

export default function SignupFormSection() {
    const method = useLoginMethod();

    return (
        <Section>
            <Container>
                <Stack className="w-full items-center max-w-md mx-auto gap-8">
                    <AuthHero
                        eyebrow="Get started"
                        title="Create your account"
                        description={
                            method == "password"
                                ? `Sign up for ${SiteData["SiteName"]}. We'll email you a code to confirm it's you.`
                                : `Sign up for ${SiteData["SiteName"]} and we'll email you a one-time login code.`
                        }
                    />
                    <SignupForm />
                    <AuthFooterLink
                        prompt="Already have an account?"
                        title="Log in"
                        url="/auth/login"
                    />
                </Stack>
            </Container>
        </Section>
    );
}

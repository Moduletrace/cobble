import Section from "@moduletrace/twui/layout/Section";
import Container from "@moduletrace/twui/layout/Container";
import Stack from "@moduletrace/twui/layout/Stack";
import AuthHero from "@/src/components/general/auth-hero";
import AuthFooterLink from "@/src/components/general/auth-footer-link";
import RequestResetForm from "../(partials)/request-reset-form";

export default function RequestResetSection() {
    return (
        <Section>
            <Container>
                <Stack className="w-full items-center max-w-md mx-auto gap-8">
                    <AuthHero
                        eyebrow="Forgot password"
                        title="Reset your password"
                        description="Enter your email or username and we'll email you a code to set a new password."
                    />
                    <RequestResetForm />
                    <AuthFooterLink
                        prompt="Remembered it?"
                        title="Log in"
                        url="/auth/login"
                    />
                </Stack>
            </Container>
        </Section>
    );
}

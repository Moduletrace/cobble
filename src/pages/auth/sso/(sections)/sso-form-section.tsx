import Section from "@moduletrace/twui/layout/Section";
import Container from "@moduletrace/twui/layout/Container";
import Stack from "@moduletrace/twui/layout/Stack";
import AuthHero from "@/src/components/general/auth-hero";
import AuthFooterLink from "@/src/components/general/auth-footer-link";
import SSOForm from "../(partials)/sso-form";
import useSSOPendingLogin from "@/src/hooks/use-sso-pending-login";
import ssoHeroDescription from "../(utils)/sso-hero-description";

export default function SSOFormSection() {
    const pending = useSSOPendingLogin();
    const is_two_step = pending?.method == "password";

    return (
        <Section>
            <Container>
                <Stack className="w-full items-center max-w-md mx-auto gap-8">
                    <AuthHero
                        eyebrow={
                            is_two_step ? "Two-step verification" : "Check your email"
                        }
                        title={
                            is_two_step ? "Verify it's you" : "Enter your login code"
                        }
                        description={ssoHeroDescription({ pending })}
                    />
                    <SSOForm />
                    <AuthFooterLink
                        prompt="Wrong account?"
                        title="Start over"
                        url="/auth/login"
                    />
                </Stack>
            </Container>
        </Section>
    );
}

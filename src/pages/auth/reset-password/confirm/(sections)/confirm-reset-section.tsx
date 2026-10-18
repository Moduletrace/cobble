import Section from "@moduletrace/twui/layout/Section";
import Container from "@moduletrace/twui/layout/Container";
import Stack from "@moduletrace/twui/layout/Stack";
import AuthHero from "@/src/components/general/auth-hero";
import AuthFooterLink from "@/src/components/general/auth-footer-link";
import useSSOPendingLogin from "@/src/hooks/use-sso-pending-login";
import { AppData } from "@/src/data/app-data";
import ConfirmResetForm from "../(partials)/confirm-reset-form";

export default function ConfirmResetSection() {
    const pending = useSSOPendingLogin();

    const expiry = `It expires in ${AppData["SSOCodeExpiryMinutes"]} minutes.`;

    return (
        <Section>
            <Container>
                <Stack className="w-full items-center max-w-md mx-auto gap-8">
                    <AuthHero
                        eyebrow="Check your email"
                        title="Set a new password"
                        description={
                            pending?.identifier
                                ? `If ${pending.identifier} matches an account, we've emailed it a 6-digit reset code. ${expiry}`
                                : `Enter the 6-digit reset code we emailed you. ${expiry}`
                        }
                    />
                    <ConfirmResetForm />
                    <AuthFooterLink
                        prompt="Wrong account?"
                        title="Start over"
                        url="/auth/reset-password"
                    />
                </Stack>
            </Container>
        </Section>
    );
}

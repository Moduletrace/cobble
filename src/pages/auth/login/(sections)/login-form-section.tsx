import Section from "@moduletrace/twui/layout/Section";
import Container from "@moduletrace/twui/layout/Container";
import Stack from "@moduletrace/twui/layout/Stack";
import AuthHero from "@/src/components/general/auth-hero";
import AuthFooterLink from "@/src/components/general/auth-footer-link";
import LoginForm from "../(partials)/login-form";
import useLoginMethod from "@/src/hooks/use-login-method";

export default function LoginFormSection() {
    const method = useLoginMethod();

    return (
        <Section>
            <Container>
                <Stack className="w-full items-center max-w-md mx-auto gap-8">
                    <AuthHero
                        eyebrow="Welcome back"
                        title="Log in to your account"
                        description={
                            method == "password"
                                ? "Log in with your password, then confirm with a code we email you."
                                : "Enter your email or username and we'll email you a one-time login code."
                        }
                    />
                    <LoginForm />
                    <AuthFooterLink
                        prompt="Don't have an account?"
                        title="Sign up"
                        url="/auth/signup"
                    />
                </Stack>
            </Container>
        </Section>
    );
}

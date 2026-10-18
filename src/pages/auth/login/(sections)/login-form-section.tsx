import Section from "@moduletrace/twui/layout/Section";
import Container from "@moduletrace/twui/layout/Container";
import Stack from "@moduletrace/twui/layout/Stack";
import AuthHero from "@/src/components/general/auth-hero";
import LoginForm from "../(partials)/login-form";

export default function LoginFormSection() {
    return (
        <Section>
            <Container>
                <Stack className="w-full items-center max-w-md mx-auto gap-8">
                    <AuthHero
                        eyebrow="Welcome back"
                        title="Log in to your account"
                        description="Log in with your email or username and password."
                    />
                    <LoginForm />
                </Stack>
            </Container>
        </Section>
    );
}

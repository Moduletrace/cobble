import Section from "@moduletrace/twui/layout/Section";
import Stack from "@moduletrace/twui/layout/Stack";
import H3 from "@moduletrace/twui/layout/H3";
import Span from "@moduletrace/twui/layout/Span";
import { AppContext } from "@/src/pages/__root";
import { useContext } from "react";
import useLoginMethod from "@/src/hooks/use-login-method";
import PasswordForm from "../(partials)/password-form";

export default function PasswordFormSection() {
    const { pageProps } = useContext(AppContext);
    const method = useLoginMethod();

    if (!pageProps?.person || method != "password") return null;

    return (
        <Section>
            <Stack className="w-full gap-6">
                <Stack className="gap-1">
                    <H3 className="mb-0!">Change Password</H3>
                    <Span variant="faded">
                        You log in with your password, then a code we email you.
                    </Span>
                </Stack>
                <PasswordForm has_password={Boolean(pageProps.has_password)} />
            </Stack>
        </Section>
    );
}

import Form from "@moduletrace/twui/form/Form";
import LoadingOverlay from "@moduletrace/twui/elements/LoadingOverlay";
import useFormInit from "@/src/hooks/use-form-init";
import useLoginMethod from "@/src/hooks/use-login-method";
import type { LoginFormObject } from "@/src/types";
import LoginShell from "@/src/components/general/login-shell";
import AuthFooterLink from "@/src/components/general/auth-footer-link";
import GoogleAuthSection from "@/src/components/general/google-auth-section";
import LoginFormEmailUsername from "./login-form-email-username";
import LoginFormPassword from "./login-form-password";
import LoginFormAction from "./login-form-action";
import submitLoginForm from "../../(functions)/submit-login-form";

export default function LoginForm() {
    const init = useFormInit<LoginFormObject>();
    const { loading, status } = init;
    const method = useLoginMethod();

    return (
        <LoginShell status={status}>
            <GoogleAuthSection {...init} mode="login" />
            <Form
                className="w-full flex items-center justify-center relative gap-4"
                onSubmit={() => {
                    submitLoginForm({ ...init, method });
                }}
            >
                {loading && <LoadingOverlay />}
                <LoginFormEmailUsername {...init} />
                {method == "password" ? <LoginFormPassword {...init} /> : null}
                <LoginFormAction method={method} />
            </Form>
            {method == "password" ? (
                <AuthFooterLink
                    prompt="Forgot your password?"
                    title="Reset it"
                    url="/auth/reset-password"
                    className="w-full text-sm"
                />
            ) : null}
            <AuthFooterLink
                prompt="Already have a code?"
                title="Enter it"
                url="/auth/sso"
                className="w-full text-sm"
            />
        </LoginShell>
    );
}

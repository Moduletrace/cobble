import Form from "@moduletrace/twui/form/Form";
import LoadingOverlay from "@moduletrace/twui/elements/LoadingOverlay";
import useFormInit from "@/src/hooks/use-form-init";
import type { LoginFormObject } from "@/src/types";
import LoginShell from "@/src/components/general/login-shell";
import GoogleAuthSection from "@/src/components/general/google-auth-section";
import LoginFormEmailUsername from "./login-form-email-username";
import LoginFormPassword from "./login-form-password";
import LoginFormAction from "./login-form-action";
import submitLoginForm from "../../(functions)/submit-login-form";

export default function LoginForm() {
    const init = useFormInit<LoginFormObject>();
    const { loading, status } = init;

    return (
        <LoginShell status={status}>
            <GoogleAuthSection {...init} />
            <Form
                className="w-full flex items-center justify-center relative gap-4"
                onSubmit={() => {
                    submitLoginForm(init);
                }}
            >
                {loading && <LoadingOverlay />}
                <LoginFormEmailUsername {...init} />
                <LoginFormPassword {...init} />
                <LoginFormAction />
            </Form>
        </LoginShell>
    );
}

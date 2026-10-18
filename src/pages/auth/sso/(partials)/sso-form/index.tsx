import Form from "@moduletrace/twui/form/Form";
import LoadingOverlay from "@moduletrace/twui/elements/LoadingOverlay";
import Button from "@moduletrace/twui/layout/Button";
import useFormInit from "@/src/hooks/use-form-init";
import { type SSOFormObject } from "@/src/types";
import LoginShell from "@/src/components/general/login-shell";
import LoginCodeInput from "@/src/components/general/login-code-input";
import ResendCodeButton from "@/src/components/general/resend-code-button";
import submitSSOForm from "../../(functions)/submit-sso-form";

export default function SSOForm() {
    const init = useFormInit<SSOFormObject>();
    const { loading, status, setForm } = init;

    return (
        <LoginShell status={status}>
            <Form
                className="w-full flex items-center justify-center relative gap-4"
                onSubmit={() => {
                    submitSSOForm(init);
                }}
            >
                {loading && <LoadingOverlay />}
                <LoginCodeInput
                    onCodeChange={(code) => {
                        setForm((prev) => ({ ...prev, code }));
                    }}
                />
                <Button title="Log in" type="submit" className="w-full">
                    Log in
                </Button>
            </Form>
            <ResendCodeButton {...init} />
        </LoginShell>
    );
}

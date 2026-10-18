import Form from "@moduletrace/twui/form/Form";
import LoadingOverlay from "@moduletrace/twui/elements/LoadingOverlay";
import Button from "@moduletrace/twui/layout/Button";
import useFormInit from "@/src/hooks/use-form-init";
import type { LoginFormObject } from "@/src/types";
import LoginShell from "@/src/components/general/login-shell";
import LoginFormEmailUsername from "@/src/pages/auth/login/(partials)/login-form/login-form-email-username";
import submitRequestReset from "../../(functions)/submit-request-reset";

export default function RequestResetForm() {
    const init = useFormInit<LoginFormObject>();
    const { loading, status } = init;

    return (
        <LoginShell status={status}>
            <Form
                className="w-full flex items-center justify-center relative gap-4"
                onSubmit={() => {
                    submitRequestReset(init);
                }}
            >
                {loading && <LoadingOverlay />}
                <LoginFormEmailUsername {...init} />
                <Button title="Email me a reset code" type="submit" className="w-full">
                    Email me a reset code
                </Button>
            </Form>
        </LoginShell>
    );
}

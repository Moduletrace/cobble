import Form from "@moduletrace/twui/form/Form";
import LoadingOverlay from "@moduletrace/twui/elements/LoadingOverlay";
import Button from "@moduletrace/twui/layout/Button";
import useFormInit from "@/src/hooks/use-form-init";
import type { PasswordResetFormObject } from "@/src/types";
import { AppData } from "@/src/data/app-data";
import LoginShell from "@/src/components/general/login-shell";
import LoginCodeInput from "@/src/components/general/login-code-input";
import PasswordInput from "@/src/components/general/password-input";
import ResendCodeButton from "@/src/components/general/resend-code-button";
import submitConfirmReset from "../../(functions)/submit-confirm-reset";

export default function ConfirmResetForm() {
    const init = useFormInit<PasswordResetFormObject>();
    const { loading, status, setForm } = init;

    return (
        <LoginShell status={status}>
            <Form
                className="w-full flex items-center justify-center relative gap-4"
                onSubmit={() => {
                    submitConfirmReset(init);
                }}
            >
                {loading && <LoadingOverlay />}
                <LoginCodeInput
                    onCodeChange={(code) => {
                        setForm((prev) => ({ ...prev, code }));
                    }}
                />
                <PasswordInput
                    id="new_password"
                    label="New password"
                    autoComplete="new-password"
                    info={`At least ${AppData["PasswordMinLength"]} characters.`}
                    onValueChange={(new_password) => {
                        setForm((prev) => ({ ...prev, new_password }));
                    }}
                    required
                />
                <PasswordInput
                    id="confirm_password"
                    label="Confirm new password"
                    autoComplete="new-password"
                    onValueChange={(confirm_password) => {
                        setForm((prev) => ({ ...prev, confirm_password }));
                    }}
                    required
                />
                <Button title="Save password and log in" type="submit" className="w-full">
                    Save password and log in
                </Button>
            </Form>
            <ResendCodeButton {...init} />
        </LoginShell>
    );
}

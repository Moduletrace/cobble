import Form from "@moduletrace/twui/form/Form";
import LoadingOverlay from "@moduletrace/twui/elements/LoadingOverlay";
import useFormInit from "@/src/hooks/use-form-init";
import { type SignupFormObject } from "@/src/types";
import LoginShell from "@/src/components/general/login-shell";
import SignupFormName from "./signup-form-name";
import SignupFormUsername from "./signup-form-username";
import SignupFormEmail from "./signup-form-email";
import SignupFormPassword from "./signup-form-password";
import SignupFormConfirmPassword from "./signup-form-confirm-password";
import SignupFormAction from "./signup-form-action";
import submitSignupForm from "../../(functions)/submit-signup-form";

export default function SignupForm() {
    const init = useFormInit<SignupFormObject>();
    const { loading, status } = init;

    return (
        <LoginShell status={status}>
            <Form
                className="w-full flex items-center justify-center relative gap-4"
                onSubmit={() => {
                    submitSignupForm(init);
                }}
            >
                {loading && <LoadingOverlay />}
                <SignupFormEmail {...init} />
                <SignupFormName {...init} />
                <SignupFormUsername {...init} />
                <SignupFormPassword {...init} />
                <SignupFormConfirmPassword {...init} />
                <SignupFormAction {...init} />
            </Form>
        </LoginShell>
    );
}

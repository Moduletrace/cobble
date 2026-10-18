import Form from "@moduletrace/twui/form/Form";
import LoadingOverlay from "@moduletrace/twui/elements/LoadingOverlay";
import useFormInit from "@/src/hooks/use-form-init";
import useLoginMethod from "@/src/hooks/use-login-method";
import { type SignupFormObject } from "@/src/types";
import LoginShell from "@/src/components/general/login-shell";
import SignupFormName from "./signup-form-name";
import SignupFormUsername from "./signup-form-username";
import SignupFormEmail from "./signup-form-email";
import SignupFormPassword from "./signup-form-password";
import SignupFormConfirmPassword from "./signup-form-confirm-password";
import GoogleAuthSection from "@/src/components/general/google-auth-section";
import SignupFormAction from "./signup-form-action";
import submitSignupForm from "../../(functions)/submit-signup-form";

export default function SignupForm() {
    const init = useFormInit<SignupFormObject>();
    const { loading, status } = init;
    const method = useLoginMethod();

    return (
        <LoginShell status={status}>
            <GoogleAuthSection {...init} mode="signup" />
            <Form
                className="w-full flex items-center justify-center relative gap-4"
                onSubmit={() => {
                    submitSignupForm({ ...init, method });
                }}
            >
                {loading && <LoadingOverlay />}
                <SignupFormEmail {...init} />
                <SignupFormName {...init} />
                <SignupFormUsername {...init} />
                {method == "password" ? (
                    <>
                        <SignupFormPassword {...init} />
                        <SignupFormConfirmPassword {...init} />
                    </>
                ) : null}
                <SignupFormAction {...init} />
            </Form>
        </LoginShell>
    );
}

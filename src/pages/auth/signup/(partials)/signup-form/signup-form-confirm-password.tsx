import useFormInit from "@/src/hooks/use-form-init";
import { type SignupFormObject } from "@/src/types";
import PasswordInput from "@/src/components/general/password-input";

export default function SignupFormConfirmPassword({
    setForm,
}: ReturnType<typeof useFormInit<SignupFormObject>>) {
    return (
        <PasswordInput
            id="confirm_password"
            label="Confirm password"
            autoComplete="new-password"
            onValueChange={(confirm_password) => {
                setForm((prev) => ({ ...prev, confirm_password }));
            }}
            required
        />
    );
}
import useFormInit from "@/src/hooks/use-form-init";
import { type SignupFormObject } from "@/src/types";
import { AppData } from "@/src/data/app-data";
import PasswordInput from "@/src/components/general/password-input";

export default function SignupFormPassword({
    setForm,
}: ReturnType<typeof useFormInit<SignupFormObject>>) {
    return (
        <PasswordInput
            id="password"
            label="Password"
            autoComplete="new-password"
            info={`At least ${AppData["PasswordMinLength"]} characters.`}
            onValueChange={(password) => {
                setForm((prev) => ({ ...prev, password }));
            }}
            required
        />
    );
}

import useFormInit from "@/src/hooks/use-form-init";
import { type LoginFormObject } from "@/src/types";
import PasswordInput from "@/src/components/general/password-input";

export default function LoginFormPassword({
    setForm,
}: ReturnType<typeof useFormInit<LoginFormObject>>) {
    return (
        <PasswordInput
            id="password"
            label="Password"
            autoComplete="current-password"
            onValueChange={(password) => {
                setForm((prev) => ({ ...prev, password }));
            }}
            required
        />
    );
}

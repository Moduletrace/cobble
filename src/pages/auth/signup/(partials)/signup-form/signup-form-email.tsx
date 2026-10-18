import Input from "@moduletrace/twui/form/Input";
import useFormInit from "@/src/hooks/use-form-init";
import { type SignupFormObject } from "@/src/types";

export default function SignupFormEmail({
    setForm,
}: ReturnType<typeof useFormInit<SignupFormObject>>) {
    return (
        <Input
            id="email"
            name="email"
            type="email"
            label="Email address"
            placeholder="you@example.com"
            autoComplete="email"
            onChange={(e) => {
                setForm((prev) => ({
                    ...prev,
                    email: e.target.value,
                }));
            }}
            showLabel
            required
        />
    );
}

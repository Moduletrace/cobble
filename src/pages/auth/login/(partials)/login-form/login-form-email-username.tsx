import Input from "@moduletrace/twui/form/Input";
import useFormInit from "@/src/hooks/use-form-init";
import { type LoginFormObject } from "@/src/types";

export default function LoginFormEmailUsername({
    setForm,
}: ReturnType<typeof useFormInit<LoginFormObject>>) {
    return (
        <Input
            id="username_or_email"
            name="username_or_email"
            type="text"
            label="Email or username"
            placeholder="you@example.com"
            autoComplete="username"
            autoCapitalize="none"
            spellCheck={false}
            onChange={(e) => {
                setForm((prev) => ({
                    ...prev,
                    username_or_email: e.target.value,
                }));
            }}
            showLabel
            required
        />
    );
}

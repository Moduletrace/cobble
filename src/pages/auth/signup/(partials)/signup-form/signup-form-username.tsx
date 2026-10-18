import Input from "@moduletrace/twui/form/Input";
import useFormInit from "@/src/hooks/use-form-init";
import { type SignupFormObject } from "@/src/types";
import { AppData } from "@/src/data/app-data";

export default function SignupFormUsername({
    setForm,
}: ReturnType<typeof useFormInit<SignupFormObject>>) {
    return (
        <Input
            id="username"
            name="username"
            type="text"
            label="Username"
            autoComplete="username"
            autoCapitalize="none"
            spellCheck={false}
            validationRegex={AppData["UsernameRegex"]}
            invalidMessage="Use 3-32 lowercase letters, numbers, dots, dashes or underscores"
            info="3-32 characters: lowercase letters, numbers, dots, dashes or underscores. You can log in with this or your email."
            onChange={(e) => {
                setForm((prev) => ({
                    ...prev,
                    username: e.target.value,
                }));
            }}
            showLabel
            required
        />
    );
}

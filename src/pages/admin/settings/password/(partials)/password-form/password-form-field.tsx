import type { AutocompleteOptions } from "@moduletrace/twui/types";
import PasswordInput from "@/src/components/general/password-input";
import useFormInit from "@/src/hooks/use-form-init";
import type { PasswordFormObject } from "@/src/types";

type Props = ReturnType<typeof useFormInit<PasswordFormObject>> & {
    field: keyof PasswordFormObject;
    label: string;
    autoComplete: (typeof AutocompleteOptions)[number];
};

export default function PasswordFormField({
    setForm,
    field,
    label,
    autoComplete,
}: Props) {
    return (
        <PasswordInput
            id={field}
            label={label}
            autoComplete={autoComplete}
            onValueChange={(value) => {
                setForm((prev) => ({ ...prev, [field]: value }));
            }}
        />
    );
}

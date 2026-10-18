import Input from "@moduletrace/twui/form/Input";
import type { AutocompleteOptions } from "@moduletrace/twui/types";
import type { ReactNode } from "react";

type Props = {
    id: string;
    label: string;
    autoComplete: (typeof AutocompleteOptions)[number];
    onValueChange: (value: string) => void;
    required?: boolean;
    info?: ReactNode;
};

export default function PasswordInput({
    id,
    label,
    autoComplete,
    onValueChange,
    required,
    info,
}: Props) {
    return (
        <Input
            id={id}
            name={id}
            type="password"
            label={label}
            autoComplete={autoComplete}
            info={info}
            onChange={(e) => {
                onValueChange(e.target.value);
            }}
            showLabel
            required={required}
        />
    );
}

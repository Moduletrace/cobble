import type {
    ChangeEvent,
    Dispatch,
    ReactNode,
    SetStateAction,
} from "react";
import Input from "@moduletrace/twui/form/Input";
import Textarea from "@moduletrace/twui/form/Textarea";
import type { AutocompleteOptions } from "@moduletrace/twui/types";
import type { UserFormObject } from "@/src/types";

type Props = {
    form: UserFormObject;
    setForm: Dispatch<SetStateAction<UserFormObject>>;
    field: "first_name" | "last_name" | "email" | "username" | "bio";
    label: string;
    type?: "text" | "email";
    autoComplete?: (typeof AutocompleteOptions)[number];
    placeholder?: string;
    info?: ReactNode;
    required?: boolean;
    multiline?: boolean;
};

/**
 * A labelled profile input bound to one `users` column.
 */
export default function ProfileTextField({
    form,
    setForm,
    field,
    label,
    type = "text",
    autoComplete,
    placeholder,
    info,
    required,
    multiline,
}: Props) {
    const shared = {
        id: `profile-${field}`,
        label,
        title: label,
        placeholder: placeholder || label,
        defaultValue: String(form[field] ?? ""),
        info,
        required,
        showLabel: true,
        onChange: (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
            const value = e.target.value;
            setForm((prev) => ({ ...prev, [field]: value }));
        },
    };

    if (multiline) {
        return <Textarea {...shared} rows={4} />;
    }

    return <Input {...shared} type={type} autoComplete={autoComplete} />;
}

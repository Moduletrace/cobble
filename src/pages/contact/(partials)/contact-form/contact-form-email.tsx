import Input from "@moduletrace/twui/form/Input";
import useFormInit from "@/src/hooks/use-form-init";
import { type ContactFormObject } from "@/src/types";

export default function ContactFormEmail({
    setForm,
}: ReturnType<typeof useFormInit<ContactFormObject>>) {
    return (
        <Input
            type="email"
            placeholder="Email"
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

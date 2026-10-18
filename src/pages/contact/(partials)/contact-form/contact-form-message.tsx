import Input from "@moduletrace/twui/form/Input";
import useFormInit from "@/src/hooks/use-form-init";
import { type ContactFormObject } from "@/src/types";

export default function ContactFormMessage({
    setForm,
}: ReturnType<typeof useFormInit<ContactFormObject>>) {
    return (
        <Input
            istextarea
            rows={6}
            placeholder="Message"
            onChange={(e) => {
                setForm((prev) => ({
                    ...prev,
                    message: e.target.value,
                }));
            }}
            showLabel
            required
        />
    );
}

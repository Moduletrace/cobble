import Input from "@moduletrace/twui/form/Input";
import useFormInit from "@/src/hooks/use-form-init";
import { type ContactFormObject } from "@/src/types";

export default function ContactFormSubject({
    setForm,
}: ReturnType<typeof useFormInit<ContactFormObject>>) {
    return (
        <Input
            type="text"
            placeholder="Subject (optional)"
            onChange={(e) => {
                setForm((prev) => ({
                    ...prev,
                    subject: e.target.value,
                }));
            }}
            showLabel
        />
    );
}

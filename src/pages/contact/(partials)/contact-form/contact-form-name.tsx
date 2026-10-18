import Input from "@moduletrace/twui/form/Input";
import useFormInit from "@/src/hooks/use-form-init";
import { type ContactFormObject } from "@/src/types";

export default function ContactFormName({
    setForm,
}: ReturnType<typeof useFormInit<ContactFormObject>>) {
    return (
        <Input
            type="text"
            placeholder="Name"
            onChange={(e) => {
                setForm((prev) => ({
                    ...prev,
                    name: e.target.value,
                }));
            }}
            showLabel
            required
        />
    );
}

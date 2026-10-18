import Input from "@moduletrace/twui/form/Input";
import Row from "@moduletrace/twui/layout/Row";
import useFormInit from "@/src/hooks/use-form-init";
import { type SignupFormObject } from "@/src/types";

export default function SignupFormName({
    setForm,
}: ReturnType<typeof useFormInit<SignupFormObject>>) {
    return (
        <Row className="w-full grid sm:grid-cols-2 gap-4">
            <Input
                id="first_name"
                name="first_name"
                type="text"
                label="First name"
                autoComplete="given-name"
                onChange={(e) => {
                    setForm((prev) => ({
                        ...prev,
                        first_name: e.target.value,
                    }));
                }}
                showLabel
                required
            />
            <Input
                id="last_name"
                name="last_name"
                type="text"
                label="Last name (optional)"
                autoComplete="family-name"
                onChange={(e) => {
                    setForm((prev) => ({
                        ...prev,
                        last_name: e.target.value,
                    }));
                }}
                showLabel
            />
        </Row>
    );
}

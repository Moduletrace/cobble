import { useState } from "react";
import Form from "@moduletrace/twui/form/Form";
import LoadingOverlay from "@moduletrace/twui/elements/LoadingOverlay";
import Tag from "@moduletrace/twui/elements/Tag";
import Row from "@moduletrace/twui/layout/Row";
import useFormInit from "@/src/hooks/use-form-init";
import type { PasswordFormObject } from "@/src/types";
import PasswordFormField from "./password-form-field";
import PasswordFormActions from "./password-form-actions";
import submitPasswordForm from "../../(functions)/submit-password-form";

type Props = {
    has_password: boolean;
};

export default function PasswordForm({ has_password: initial }: Props) {
    const init = useFormInit<PasswordFormObject>();
    const { loading, status } = init;

    const [has_password, setHasPassword] = useState(initial);
    const [form_key, setFormKey] = useState(0);

    const onDone = ({ has_password }: { has_password: boolean }) => {
        setHasPassword(has_password);
        init.setForm({});
        setFormKey((prev) => prev + 1);
    };

    return (
        <Form
            key={form_key}
            className="w-full gap-6"
            onSubmit={() => {
                submitPasswordForm({ ...init, has_password, onDone });
            }}
        >
            {status?.error && <Tag color="error">{status.msg}</Tag>}
            {status?.success && <Tag color="success">{status.msg}</Tag>}
            {loading && <LoadingOverlay />}

            {has_password ? (
                <PasswordFormField
                    {...init}
                    field="current_password"
                    label="Current password"
                    autoComplete="current-password"
                />
            ) : null}
            <Row className="w-full grid xl:grid-cols-2">
                <PasswordFormField
                    {...init}
                    field="new_password"
                    label={has_password ? "New password" : "Password"}
                    autoComplete="new-password"
                />
                <PasswordFormField
                    {...init}
                    field="confirm_password"
                    label="Confirm password"
                    autoComplete="new-password"
                />
            </Row>
            <PasswordFormActions has_password={has_password} />
        </Form>
    );
}

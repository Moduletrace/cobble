import { useState } from "react";
import Form from "@moduletrace/twui/form/Form";
import useFormInit from "@/src/hooks/use-form-init";
import type { PasswordFormObject } from "@/src/types";
import { AppData } from "@/src/data/app-data";
import SettingsGroup from "../../../(partials)/settings-group";
import SettingsSaveBar from "../../../(partials)/settings-save-bar";
import PasswordFormField from "./password-form-field";
import submitPasswordForm from "../../(functions)/submit-password-form";

type Props = {
    has_password: boolean;
};

export default function PasswordForm({ has_password: initial }: Props) {
    const init = useFormInit<PasswordFormObject>();
    const { form, loading, status, setStatus } = init;

    const [has_password, setHasPassword] = useState(initial);
    /**
     * Inputs are uncontrolled; bumping this clears them.
     */
    const [form_key, setFormKey] = useState(0);
    /**
     * Kept here, not in `status`: `useFormInit` clears `status` whenever
     * the form changes, and a successful save clears the form.
     */
    const [notice, setNotice] = useState<string>();

    const dirty = Boolean(
        form.current_password || form.new_password || form.confirm_password,
    );

    const clear = () => {
        init.setForm({});
        setFormKey((prev) => prev + 1);
    };

    const onDone = ({ has_password, msg }: { has_password: boolean; msg: string }) => {
        setHasPassword(has_password);
        setNotice(msg);
        clear();
    };

    const save_label = has_password ? "Change password" : "Set password";

    return (
        <Form
            key={form_key}
            className="w-full gap-0! items-stretch"
            onSubmit={() => {
                if (!dirty || loading) return;
                if (!window.confirm(has_password ? `Change your password?` : `Set your password?`)) return;
                submitPasswordForm({ ...init, has_password, onDone });
            }}
        >
            {has_password ? (
                <SettingsGroup
                    title="Current password"
                    description="So we know it's you."
                >
                    <PasswordFormField
                        {...init}
                        field="current_password"
                        label="Current password"
                        autoComplete="current-password"
                    />
                </SettingsGroup>
            ) : null}
            <SettingsGroup
                title={has_password ? "New password" : "Password"}
                description={`At least ${AppData["PasswordMinLength"]} characters. You'll stay logged in here.`}
            >
                <PasswordFormField
                    {...init}
                    field="new_password"
                    label={has_password ? "New password" : "Password"}
                    autoComplete="new-password"
                />
                <PasswordFormField
                    {...init}
                    field="confirm_password"
                    label="Type it again"
                    autoComplete="new-password"
                />
            </SettingsGroup>
            <SettingsSaveBar
                dirty={dirty}
                loading={loading}
                status={
                    status?.msg
                        ? status
                        : !dirty && notice
                          ? { success: true, msg: notice }
                          : undefined
                }
                save_label={save_label}
                onDiscard={() => {
                    setStatus({});
                    setNotice(undefined);
                    clear();
                }}
            />
        </Form>
    );
}

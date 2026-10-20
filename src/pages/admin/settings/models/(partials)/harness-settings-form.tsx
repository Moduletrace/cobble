import { useEffect, useState } from "react";
import Form from "@moduletrace/twui/form/Form";
import useFormInit from "@/src/hooks/use-form-init";
import type { HarnessOverview, HarnessSettingsFormObject } from "@/src/types";
import SettingsSaveBar from "../../(partials)/settings-save-bar";
import changedHarnessSettings from "../(utils)/changed-harness-settings";
import toHarnessForm from "../(utils)/to-harness-form";
import HarnessSettingGroup from "./harness-setting-group";

type Props = {
    harnesses: HarnessOverview[];
    /**
     * Sends the changed settings. The page refreshes its own data on
     * success (which remounts this form).
     */
    save: (params: {
        settings: ReturnType<typeof changedHarnessSettings>;
    }) => Promise<{ success: boolean; msg?: string }>;
    /**
     * The last save's message, kept by the page across the remount.
     */
    notice?: string;
    /**
     * Whether there are unsaved edits, so a background refresh can leave
     * them alone.
     */
    onDirtyChange?: (dirty: boolean) => void;
};

/**
 * Which model each harness uses, saved together from one save bar. Used
 * for the defaults and, with "same as the default", for a worker bot.
 */
export default function HarnessSettingsForm({
    harnesses,
    save,
    notice: saved_notice,
    onDirtyChange,
}: Props) {
    const saved = toHarnessForm({ harnesses });
    /**
     * Inputs keep their own state; bumping this remounts them on Discard.
     */
    const [form_key, setFormKey] = useState(0);
    /**
     * Kept here: `useFormInit` clears `status` whenever the form changes.
     */
    const [notice, setNotice] = useState<string | undefined>(saved_notice);

    const { form, setForm, loading, setLoading, status, setStatus } =
        useFormInit<HarnessSettingsFormObject>({ existing: saved });

    const changed = changedHarnessSettings({ form, saved });
    const dirty = changed.length > 0;

    useEffect(() => {
        onDirtyChange?.(dirty);
    }, [dirty, onDirtyChange]);

    const discard = () => {
        setForm(saved);
        setStatus({});
        setNotice(undefined);
        setFormKey((prev) => prev + 1);
    };

    const submit = async () => {
        if (!dirty || loading) return;
        if (!window.confirm(`Save these model settings?`)) return;

        setLoading(true);
        setStatus({});

        const res = await save({ settings: changed });

        setLoading(false);

        if (!res.success) {
            setStatus({ error: true, msg: res.msg || "Couldn't save the model settings." });
            return;
        }

        setNotice(res.msg || "Saved.");
    };

    return (
        <Form key={form_key} className="w-full gap-0! items-stretch" onSubmit={submit}>
            {harnesses.map((harness) => (
                <HarnessSettingGroup
                    key={harness.harness}
                    harness={harness}
                    value={form[harness.harness] || saved[harness.harness]!}
                    onChange={(value) => {
                        setNotice(undefined);
                        setForm((prev) => ({ ...prev, [harness.harness]: value }));
                    }}
                />
            ))}

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
                onDiscard={discard}
            />
        </Form>
    );
}

import { useState } from "react";
import fetchApi from "@moduletrace/twui/utils/fetch/fetchApi";
import type { APIResponseObject } from "@moduletrace/bunext/types";
import Form from "@moduletrace/twui/form/Form";
import Stack from "@moduletrace/twui/layout/Stack";
import type { RunLimitsOverview } from "@/src/functions/backend/db/app-settings/grab-run-limits";
import SettingsSaveBar from "../../(partials)/settings-save-bar";
import RunLimitInput from "./run-limit-input";

type Props = {
    limits?: RunLimitsOverview | null;
};

type Values = {
    task_steps: string;
    reply_steps: string;
    unattended_steps: string;
    run_tokens: string;
    context_tokens: string;
};

const valuesOf = (limits?: RunLimitsOverview | null): Values => ({
    task_steps: String(limits?.task_steps ?? ""),
    reply_steps: String(limits?.reply_steps ?? ""),
    unattended_steps: String(limits?.unattended_steps ?? ""),
    run_tokens: String(limits?.run_tokens ?? ""),
    context_tokens: String(limits?.context_tokens ?? ""),
});

const count = (value?: number) => (value ?? 0).toLocaleString("en-US");

/**
 * How long a bot may work on one run (model turns per task, reply and
 * routine or hook call, the prompt tokens one run may spend) and how much
 * of its work it resends per turn, saved on its own without a reload. Zero
 * puts the code's default back for that one.
 */
export default function RunLimitsForm({ limits }: Props) {
    const [overview, setOverview] = useState(limits || undefined);
    const [dirty, setDirty] = useState(false);
    const [values, setValues] = useState<Values>(valuesOf(limits));
    /**
     * The inputs only read `defaultValue` when they mount, so discarding or
     * saving remounts them with the saved numbers.
     */
    const [form_key, setFormKey] = useState(0);
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState<{
        msg?: string;
        error?: boolean;
        success?: boolean;
    }>();

    const change = (key: keyof Values) => (value: string) => {
        setValues((current) => ({ ...current, [key]: value }));
        setDirty(true);
        setStatus(undefined);
    };

    const save = async () => {
        if (loading) return;
        if (!window.confirm("Save these run limits? They apply to every bot's next run.")) return;

        setLoading(true);
        setStatus(undefined);

        const res = await fetchApi<{}, APIResponseObject<RunLimitsOverview>>(
            "/api/admin/settings/run-limits",
            {
                method: "POST",
                body: {
                    task_steps: Number(values.task_steps) || 0,
                    reply_steps: Number(values.reply_steps) || 0,
                    unattended_steps: Number(values.unattended_steps) || 0,
                    run_tokens: Number(values.run_tokens) || 0,
                    context_tokens: Number(values.context_tokens) || 0,
                },
            },
        ).catch(() => null);

        setLoading(false);

        if (!res?.success || !res.singleRes) {
            setStatus({
                error: true,
                msg: res?.msg || `Couldn't save the limits.`,
            });
            return;
        }

        setOverview(res.singleRes);
        setValues(valuesOf(res.singleRes));
        setFormKey((key) => key + 1);
        setDirty(false);
        setStatus({
            success: true,
            msg: `Saved: ${res.singleRes.task_steps} steps per task, ${res.singleRes.reply_steps} per reply, ${res.singleRes.unattended_steps} per routine or hook call.`,
        });
    };

    const discard = () => {
        setValues(valuesOf(overview));
        setFormKey((key) => key + 1);
        setDirty(false);
        setStatus(undefined);
    };

    return (
        <Form
            onSubmit={(event) => {
                event.preventDefault();
                save().catch(() => {});
            }}
            className="w-full gap-3! items-stretch"
        >
            <Stack key={form_key} className="w-full gap-3! items-stretch">
                <RunLimitInput
                    label="Tool steps per task"
                    value={values.task_steps}
                    max={overview?.max}
                    suffix="steps"
                    onChange={change("task_steps")}
                    info={`How many turns the model may take before it must stop and report, when it works on a task. 0 uses the default (${overview?.task_default ?? ""}).`}
                />
                <RunLimitInput
                    label="Tool steps per chat reply"
                    value={values.reply_steps}
                    max={overview?.max}
                    suffix="steps"
                    onChange={change("reply_steps")}
                    info={`How many turns a chat reply may take before it answers. Long work belongs in a task. 0 uses the default (${overview?.reply_default ?? ""}).`}
                />
                <RunLimitInput
                    label="Tool steps per routine or hook call"
                    value={values.unattended_steps}
                    max={overview?.max}
                    suffix="steps"
                    onChange={change("unattended_steps")}
                    info={`Routine runs and hook calls work with nobody watching, so they stop sooner. Never more than the task limit. 0 uses the default (${overview?.unattended_default ?? ""}).`}
                />
                <RunLimitInput
                    label="Tokens per run"
                    value={values.run_tokens}
                    max={overview?.run_tokens_max}
                    suffix="tokens"
                    onChange={change("run_tokens")}
                    info={`Every turn sends the prompt again, so a run's prompt tokens add up fast. Once a task or reply has sent this many, its next turn is its last and it reports. Between ${count(overview?.run_tokens_min)} and ${count(overview?.run_tokens_max)}; 0 uses the default (${count(overview?.run_tokens_default)}).`}
                />
                <RunLimitInput
                    label="Working context"
                    value={values.context_tokens}
                    max={overview?.context_tokens_max}
                    suffix="tokens"
                    onChange={change("context_tokens")}
                    info={`How much a run sends per turn (its prompt, its tools and what it has done so far) before the oldest tool output is cut, whatever the model's window. Smaller costs less per turn; larger lets a bot keep more of what it read. Between ${count(overview?.context_tokens_min)} and ${count(overview?.context_tokens_max)}; 0 uses the default (${count(overview?.context_tokens_default)}).`}
                />
            </Stack>
            <SettingsSaveBar
                dirty={dirty}
                loading={loading}
                status={status}
                save_label="Save limits"
                onDiscard={discard}
            />
        </Form>
    );
}

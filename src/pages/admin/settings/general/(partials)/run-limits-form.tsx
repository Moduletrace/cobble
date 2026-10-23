import { useState } from "react";
import fetchApi from "@moduletrace/twui/utils/fetch/fetchApi";
import type { APIResponseObject } from "@moduletrace/bunext/types";
import Form from "@moduletrace/twui/form/Form";
import Input from "@moduletrace/twui/form/Input";
import Stack from "@moduletrace/twui/layout/Stack";
import type { RunLimitsOverview } from "@/src/functions/backend/db/app-settings/grab-run-limits";
import SettingsSaveBar from "../../(partials)/settings-save-bar";

type Props = {
    limits?: RunLimitsOverview | null;
};

/**
 * How many model turns a task run and a chat reply may take, saved on its
 * own without a reload. Zero puts the code's default back for that one.
 */
export default function RunLimitsForm({ limits }: Props) {
    const [overview, setOverview] = useState(limits || undefined);
    const [dirty, setDirty] = useState(false);
    const [task_steps, setTaskSteps] = useState(String(limits?.task_steps ?? ""));
    const [reply_steps, setReplySteps] = useState(String(limits?.reply_steps ?? ""));
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

    const save = async () => {
        setLoading(true);
        setStatus(undefined);

        const res = await fetchApi<{}, APIResponseObject<RunLimitsOverview>>(
            "/api/admin/settings/run-limits",
            {
                method: "POST",
                body: {
                    task_steps: Number(task_steps) || 0,
                    reply_steps: Number(reply_steps) || 0,
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
        setTaskSteps(String(res.singleRes.task_steps));
        setReplySteps(String(res.singleRes.reply_steps));
        setFormKey((key) => key + 1);
        setDirty(false);
        setStatus({
            success: true,
            msg: `Saved: ${res.singleRes.task_steps} steps per task, ${res.singleRes.reply_steps} per reply.`,
        });
    };

    const discard = () => {
        setTaskSteps(String(overview?.task_steps ?? ""));
        setReplySteps(String(overview?.reply_steps ?? ""));
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
            <Stack className="w-full gap-3! items-stretch">
                <Input
                    key={`task-${form_key}`}
                    label="Tool steps per task"
                    type="number"
                    min={0}
                    max={overview?.max}
                    step={1}
                    numberText
                    rawNumber
                    defaultValue={task_steps}
                    onChange={(event) => {
                        setTaskSteps(event.target.value);
                        setDirty(true);
                        setStatus(undefined);
                    }}
                    suffix={`steps`}
                    info={`How many turns the model may take before it must stop and report, when it works on a task. 0 uses the default (${overview?.task_default ?? ""}).`}
                />
                <Input
                    key={`reply-${form_key}`}
                    label="Tool steps per chat reply"
                    type="number"
                    min={0}
                    max={overview?.max}
                    step={1}
                    numberText
                    rawNumber
                    defaultValue={reply_steps}
                    onChange={(event) => {
                        setReplySteps(event.target.value);
                        setDirty(true);
                        setStatus(undefined);
                    }}
                    suffix={`steps`}
                    info={`How many turns a chat reply may take before it answers. Long work belongs in a task. 0 uses the default (${overview?.reply_default ?? ""}).`}
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

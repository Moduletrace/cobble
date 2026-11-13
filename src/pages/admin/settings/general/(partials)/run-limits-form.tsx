import { useState } from "react";
import fetchApi from "@moduletrace/twui/utils/fetch/fetchApi";
import type { APIResponseObject } from "@moduletrace/bunext/types";
import Form from "@moduletrace/twui/form/Form";
import Stack from "@moduletrace/twui/layout/Stack";
import { AppData } from "@/src/data/app-data";
import type { RunLimitsOverview } from "@/src/functions/backend/db/app-settings/grab-run-limits";
import { isUnlimitedLimit, type RunLimit } from "@/src/utils/run-limit";
import SettingsSaveBar from "../../(partials)/settings-save-bar";
import RunLimitInput from "./run-limit-input";
import {
    emptyRunLimitFields,
    startRunLimitNumber,
    type RunLimitFieldKey,
    type RunLimitFieldValue,
} from "./run-limit-fields";

type Props = {
    limits?: RunLimitsOverview | null;
};

type LimitKey = RunLimitFieldKey;

type FieldValue = RunLimitFieldValue;

type Values = Record<LimitKey, FieldValue>;

const count = (value?: number) => (value ?? 0).toLocaleString("en-US");

/**
 * A limit the way the page says it: its number, or "unlimited".
 */
const described = (limit: RunLimit) => (isUnlimitedLimit(limit) ? "unlimited" : count(limit));

const valuesOf = (limits?: RunLimitsOverview | null): Values => {
    const field = (limit?: RunLimit): FieldValue => ({
        value: limit === undefined || isUnlimitedLimit(limit) ? "" : String(limit),
        unlimited: isUnlimitedLimit(limit),
    });

    return {
        task_steps: field(limits?.task_steps),
        reply_steps: field(limits?.reply_steps),
        unattended_steps: field(limits?.unattended_steps),
        run_tokens: field(limits?.run_tokens),
        context_tokens: field(limits?.context_tokens),
        model_rest_seconds: field(limits?.model_rest_seconds),
    };
};

/**
 * What was saved, said the way the fields read: "Saved: unlimited steps
 * per task, ...".
 */
const savedMessage = (limits: RunLimitsOverview) =>
    `Saved: ${described(limits.task_steps)} steps per task, ${described(limits.reply_steps)} per chat reply, ${described(limits.unattended_steps)} per routine or hook call, ${described(limits.run_tokens)} prompt tokens per run, ${described(limits.context_tokens)} tokens of working context, and ${described(limits.model_rest_seconds)} seconds of model rest.`;

/**
 * How long a bot may work on one run: the model turns a task, a chat
 * reply, a routine or a hook call may take, the prompt tokens a run may
 * spend, and how much of its work it resends per turn. Plus how long a
 * failed model rests. Saved on its own, without a reload. A field takes a
 * number, or no limit at all with its switch; zero puts the code's
 * default back for that one.
 */
export default function RunLimitsForm({ limits }: Props) {
    const [overview, setOverview] = useState(limits || undefined);
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

    /**
     * What a field falls back to when its switch is turned off and it holds
     * no number yet: the default the setting would use, or the top of its
     * range when that default is unlimited too.
     */
    const starts: Record<LimitKey, number> = {
        task_steps: startRunLimitNumber({
            limit: overview?.task_default,
            ceiling: overview?.max ?? AppData.BotStepLimitMax,
        }),
        reply_steps: startRunLimitNumber({
            limit: overview?.reply_default,
            ceiling: overview?.max ?? AppData.BotStepLimitMax,
        }),
        unattended_steps: startRunLimitNumber({
            limit: overview?.unattended_default,
            ceiling: overview?.max ?? AppData.BotStepLimitMax,
        }),
        run_tokens: startRunLimitNumber({
            limit: overview?.run_tokens_default,
            ceiling: overview?.run_tokens_max ?? AppData.RunMaxPromptTokensMax,
        }),
        context_tokens: startRunLimitNumber({
            limit: overview?.context_tokens_default,
            ceiling: overview?.context_tokens_max ?? AppData.HarnessContextBudgetMaxTokens,
        }),
        model_rest_seconds: startRunLimitNumber({
            limit: overview?.model_rest_default,
            ceiling: overview?.model_rest_max ?? AppData.HarnessModelRestMaxSeconds,
        }),
    };

    const change = (key: LimitKey) => (value: string) => {
        setValues((current) => ({ ...current, [key]: { ...current[key], value } }));
        setStatus(undefined);
    };

    /**
     * The switch sits before the save: a change it makes counts, a report
     * of the state it mounted with is not a change. Switching it off fills
     * the field with the number it would use, so no field is ever left
     * holding a blank that saves as something else. The fields are remounted
     * (their `key`), since a number they only read when they mount has to
     * change for the switch.
     */
    const changeUnlimited = (key: LimitKey) => (unlimited: boolean) => {
        if (values[key].unlimited === unlimited) return;

        setValues((current) => ({
            ...current,
            [key]: {
                value: unlimited ? current[key].value : current[key].value || String(starts[key]),
                unlimited,
            },
        }));
        setFormKey((key) => key + 1);
        setStatus(undefined);
    };

    /**
     * What a field sends: -1 for no limit, 0 (the default) for nothing
     * typed, its number otherwise.
     */
    const sent = (key: LimitKey) => (values[key].unlimited ? -1 : Number(values[key].value) || 0);

    /**
     * A field differs from what was saved, by its number or its switch.
     * Turning a switch back where it was is no change.
     */
    const saved = valuesOf(overview);
    const dirty = (Object.keys(saved) as LimitKey[]).some(
        (key) => saved[key].unlimited !== values[key].unlimited || saved[key].value !== values[key].value,
    );

    /**
     * A field with its switch off but no number in it would save as 0, and
     * 0 is the code's default, which may itself be no limit: the form asks
     * for a number instead of saving something the user didn't mean.
     */
    const empty = emptyRunLimitFields({ values });

    const save = async () => {
        if (loading) return;

        if (empty.length) {
            setStatus({
                error: true,
                msg: `${empty.join(", ")}: enter a number, or turn on No limit.`,
            });
            return;
        }

        if (
            !window.confirm(
                "Save these run limits? They apply to every bot's next run.",
            )
        )
            return;

        setLoading(true);
        setStatus(undefined);

        const res = await fetchApi<{}, APIResponseObject<RunLimitsOverview>>(
            "/api/admin/settings/run-limits",
            {
                method: "POST",
                body: {
                    task_steps: sent("task_steps"),
                    reply_steps: sent("reply_steps"),
                    unattended_steps: sent("unattended_steps"),
                    run_tokens: sent("run_tokens"),
                    context_tokens: sent("context_tokens"),
                    model_rest_seconds: sent("model_rest_seconds"),
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
        setStatus({
            success: true,
            msg: savedMessage(res.singleRes),
        });
    };

    const discard = () => {
        setValues(valuesOf(overview));
        setFormKey((key) => key + 1);
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
            <Stack key={form_key} className="w-full gap-4! items-stretch">
                <RunLimitInput
                    id="task_steps"
                    label="Tool steps per task"
                    value={values.task_steps.value}
                    unlimited={values.task_steps.unlimited}
                    max={overview?.max}
                    suffix="steps"
                    onChange={change("task_steps")}
                    onUnlimitedChange={changeUnlimited("task_steps")}
                    info={`How many turns the model may take before it must stop and report, when it works on a task. 0 uses the default (${described(overview?.task_default ?? 0)})${overview?.max ? `. Max steps ${overview.max}` : ``}. With No limit on, the job's own deadline is what stops it.`}
                />
                <RunLimitInput
                    id="reply_steps"
                    label="Tool steps per chat reply"
                    value={values.reply_steps.value}
                    unlimited={values.reply_steps.unlimited}
                    max={overview?.max}
                    suffix="steps"
                    onChange={change("reply_steps")}
                    onUnlimitedChange={changeUnlimited("reply_steps")}
                    info={`How many turns a chat reply may take before it answers. Long work belongs in a task. 0 uses the default (${described(overview?.reply_default ?? 0)}). With No limit on, the job's own deadline is what stops it.`}
                />
                <RunLimitInput
                    id="unattended_steps"
                    label="Tool steps per routine or hook call"
                    value={values.unattended_steps.value}
                    unlimited={values.unattended_steps.unlimited}
                    max={overview?.max}
                    suffix="steps"
                    onChange={change("unattended_steps")}
                    onUnlimitedChange={changeUnlimited("unattended_steps")}
                    info={`Routine runs and hook calls work with nobody watching. Never more than the task limit. 0 uses the default (${described(overview?.unattended_default ?? 0)}). With No limit on, the job's own deadline is what stops it.`}
                />
                <RunLimitInput
                    id="run_tokens"
                    label="Tokens per run"
                    value={values.run_tokens.value}
                    unlimited={values.run_tokens.unlimited}
                    max={overview?.run_tokens_max}
                    suffix="tokens"
                    onChange={change("run_tokens")}
                    onUnlimitedChange={changeUnlimited("run_tokens")}
                    info={`Every turn sends the prompt again, so a run's prompt tokens add up fast. Once a task or reply has sent this many, its next turn is its last and it reports. Between ${count(overview?.run_tokens_min)} and ${count(overview?.run_tokens_max)}; 0 uses the default (${described(overview?.run_tokens_default ?? 0)}).`}
                />
                <RunLimitInput
                    id="context_tokens"
                    label="Working context"
                    value={values.context_tokens.value}
                    unlimited={values.context_tokens.unlimited}
                    max={overview?.context_tokens_max}
                    suffix="tokens"
                    onChange={change("context_tokens")}
                    onUnlimitedChange={changeUnlimited("context_tokens")}
                    info={`How much a run sends per turn (its prompt, its tools and what it has done so far) before the oldest tool output is cut, whatever the model's window. Smaller costs less per turn; larger lets a bot keep more of what it read. Between ${count(overview?.context_tokens_min)} and ${count(overview?.context_tokens_max)}; 0 uses the default (${described(overview?.context_tokens_default ?? 0)}). With No limit on, the model's own window decides.`}
                />
                <RunLimitInput
                    id="model_rest_seconds"
                    label="Model rest after a failure"
                    value={values.model_rest_seconds.value}
                    unlimited={values.model_rest_seconds.unlimited}
                    max={overview?.model_rest_max}
                    suffix="seconds"
                    onChange={change("model_rest_seconds")}
                    onUnlimitedChange={changeUnlimited("model_rest_seconds")}
                    info={`When a model errors or is rate limited, it is passed over for this long and the next model in line answers (its fallback models, then the free picks). Shorter goes back to your pick sooner. Between ${overview?.model_rest_min ?? ""} and ${count(overview?.model_rest_max)}; 0 uses the default (${described(overview?.model_rest_default ?? 0)}). With No limit on, a failed model is passed over until the setting changes or the app restarts.`}
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

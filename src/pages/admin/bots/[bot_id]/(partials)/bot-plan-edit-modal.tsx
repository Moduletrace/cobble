import { useState } from "react";
import Button from "@moduletrace/twui/layout/Button";
import Form from "@moduletrace/twui/form/Form";
import Input from "@moduletrace/twui/form/Input";
import Span from "@moduletrace/twui/layout/Span";
import Stack from "@moduletrace/twui/layout/Stack";
import Textarea from "@moduletrace/twui/form/Textarea";
import AddFormActions from "@/src/layouts/bots/(partials)/add-form-actions";
import AddModalShell from "@/src/layouts/bots/(partials)/add-modal-shell";
import { AppData } from "@/src/data/app-data";
import type { BotPlanView } from "@/src/types";
import saveBotPlan from "../(functions)/save-bot-plan";
import BotPlanStepField from "./bot-plan-step-field";

type Props = {
    view: BotPlanView;
    onSaved: (view: BotPlanView) => void;
    onCancel: () => void;
};

type Field = {
    /**
     * What React keys the row by, so taking one out doesn't shuffle what
     * the others show.
     */
    key: number;
    text: string;
    /**
     * A step already worked: it reads as it was, and stays at the top.
     */
    locked?: boolean;
};

let next_key = 1;

/**
 * The plan before the bot starts on it, as the user wants it: its title,
 * what the plan is for, and the steps. Steps already done are the record of
 * work that happened, so they read only and stay where they are.
 */
export default function BotPlanEditModal({ view, onSaved, onCancel }: Props) {
    const [title, setTitle] = useState(view.title);
    const [goal, setGoal] = useState(view.goal);
    const [fields, setFields] = useState<Field[]>(() =>
        view.steps.map((step) => ({
            key: next_key++,
            text: step.text,
            locked: step.state != "pending",
        })),
    );
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string>();

    const setField = ({ key, text }: { key: number; text: string }) =>
        setFields((current) => current.map((field) => (field.key == key ? { ...field, text } : field)));

    const removeField = ({ key }: { key: number }) =>
        setFields((current) => current.filter((field) => field.key != key));

    const addField = () =>
        setFields((current) => [
            ...current,
            { key: next_key++, text: "" },
        ]);

    const submit = async () => {
        if (loading) return;

        const steps = fields.map((field) => field.text.trim()).filter(Boolean);

        if (!steps.length) {
            setError(`A plan needs at least one step.`);
            return;
        }

        setLoading(true);
        setError(undefined);

        const res = await saveBotPlan({ plan_id: view.id, title: title.trim(), goal: goal.trim(), steps });

        setLoading(false);

        if (!res.success || !res.singleRes) {
            setError(res.msg || `Couldn't save the plan.`);
            return;
        }

        onSaved(res.singleRes);
    };

    return (
        <AddModalShell
            open
            setOpen={(next) => !next && onCancel()}
            title="Change the plan"
            description="The steps the bot works, one per reply. Steps already done stay as they are."
        >
            <Form className="w-full gap-4! items-stretch pt-4" onSubmit={submit}>
                <Input
                    id="plan-title"
                    title="Title"
                    label="Title"
                    showLabel
                    placeholder="Audit the pricing pages"
                    defaultValue={title}
                    maxLength={AppData.BotPlanTitleMaxChars}
                    autoComplete="off"
                    onChange={(e) => setTitle(e.target.value)}
                />

                <Textarea
                    id="plan-goal"
                    title="Goal"
                    label="Goal"
                    showLabel
                    rows={2}
                    placeholder="What finished looks like, in one sentence."
                    defaultValue={goal}
                    info={`Up to ${AppData.BotPlanGoalMaxChars} characters.`}
                    onChange={(e) => setGoal(e.target.value)}
                />

                <Stack className="w-full gap-2! items-stretch">
                    <Span className="text-[13px] leading-[18px] font-bold text-ink">
                        Steps ({fields.length} of {AppData.BotPlanMaxSteps})
                    </Span>

                    {fields.map((field, index) => (
                        <BotPlanStepField
                            key={field.key}
                            index={index}
                            text={field.text}
                            locked={field.locked}
                            onChange={({ text }) => setField({ key: field.key, text })}
                            onRemove={() => removeField({ key: field.key })}
                        />
                    ))}

                    <Button
                        title="Add a step"
                        type="button"
                        variant="outlined"
                        color="gray"
                        size="smaller"
                        className="self-start"
                        disabled={fields.length >= AppData.BotPlanMaxSteps}
                        onClick={addField}
                    >
                        Add a step
                    </Button>
                </Stack>

                <AddFormActions submit_label="Save the plan" loading={loading} error={error} onCancel={onCancel} />
            </Form>
        </AddModalShell>
    );
}
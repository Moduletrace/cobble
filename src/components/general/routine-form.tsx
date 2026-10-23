import { useState } from "react";
import Form from "@moduletrace/twui/form/Form";
import Input from "@moduletrace/twui/form/Input";
import CodeEditor from "@/src/components/general/code-editor";
import postAdminApi from "@/src/layouts/bots/(functions)/post-admin-api";
import AddFormActions from "@/src/layouts/bots/(partials)/add-form-actions";
import type { CronJobWithNames } from "@/src/types";

type Props = {
    cron_job: CronJobWithNames;
    onCancel: () => void;
    onSaved: (params: { cron_job: CronJobWithNames }) => void;
};

/**
 * A routine's name, schedule (a cron expression in UTC) and brief. The
 * routines page and the conversation's routines modal both edit with it.
 */
export default function RoutineForm({ cron_job, onCancel, onSaved }: Props) {
    const [title, setTitle] = useState(cron_job.title || "");
    const [schedule, setSchedule] = useState(cron_job.schedule || "");
    const [instructions, setInstructions] = useState(cron_job.instructions || "");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string>();

    const submit = async () => {
        if (loading) return;
        if (!window.confirm(`Save ${title || "this routine"}?`)) return;

        setLoading(true);
        setError(undefined);

        const res = await postAdminApi<CronJobWithNames>({
            path: "routines/update-routine",
            body: { cron_job_id: cron_job.id, title, schedule, instructions },
        });

        setLoading(false);

        if (!res.success || !res.singleRes) {
            setError(res.msg || "Couldn't save the routine.");
            return;
        }

        onSaved({ cron_job: res.singleRes });
    };

    return (
        <Form className="w-full gap-4! items-stretch pt-4" onSubmit={submit}>
            <Input
                id="routine-title"
                title="Name"
                label="Name"
                showLabel
                autoComplete="off"
                defaultValue={title}
                onChange={(e) => setTitle(e.target.value)}
            />
            <Input
                id="routine-schedule"
                title="Schedule"
                label="Schedule"
                showLabel
                autoComplete="off"
                placeholder="0 9 * * MON-FRI"
                defaultValue={schedule}
                info="Cron, in UTC: minute hour day month weekday, or @hourly, @daily, @weekly."
                onChange={(e) => setSchedule(e.target.value)}
            />
            <CodeEditor
                mode="markdown"
                className="h-40"
                title="Brief"
                content={instructions}
                info="What the bot does at every run, and how it knows it's done."
                onChange={(value) => setInstructions(value)}
            />
            <AddFormActions submit_label="Save" loading={loading} error={error} onCancel={onCancel} />
        </Form>
    );
}

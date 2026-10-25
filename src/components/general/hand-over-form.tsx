import { useEffect, useState } from "react";
import Form from "@moduletrace/twui/form/Form";
import Select from "@moduletrace/twui/form/Select";
import Textarea from "@moduletrace/twui/form/Textarea";
import Span from "@moduletrace/twui/layout/Span";
import Stack from "@moduletrace/twui/layout/Stack";
import postAdminApi from "@/src/layouts/bots/(functions)/post-admin-api";
import AddFormActions from "@/src/layouts/bots/(partials)/add-form-actions";
import type { HandOverTarget } from "@/src/types";

type Props<T> = {
    /**
     * What is handed over, for the confirm ("the task "Draft the post"").
     */
    what: string;
    /**
     * Under `/api/admin/`: who it can go to, and the hand-over itself.
     * Both get `body`; the hand-over also the picked `bot_id`.
     */
    targets_path: string;
    submit_path: string;
    body: Record<string, unknown>;
    /**
     * Offer a note added to the brief (a task's hand-over).
     */
    with_note?: boolean;
    onHandedOver: (params: { saved: T; msg: string }) => void;
    onCancel: () => void;
};

/**
 * Picks the bot a task or routine goes to (the ones already where it runs,
 * loaded when the form opens) and hands it over. Shared by the task panel
 * and both routine lists.
 */
export default function HandOverForm<T extends { [k: string]: any }>({
    what,
    targets_path,
    submit_path,
    body,
    with_note,
    onHandedOver,
    onCancel,
}: Props<T>) {
    const [targets, setTargets] = useState<HandOverTarget[]>();
    const [bot_id, setBotId] = useState<number>();
    const [note, setNote] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string>();

    useEffect(() => {
        postAdminApi<HandOverTarget>({ path: targets_path, body }).then((res) => {
            if (!res.success) {
                setError(res.msg || "Couldn't load the bots.");
                setTargets([]);
                return;
            }

            const list = (res.payload || []) as HandOverTarget[];

            setTargets(list);
            setBotId(list[0]?.id);
        });
    }, [targets_path]);

    const submit = async () => {
        if (loading) return;

        const target = targets?.find((it) => it.id == bot_id);

        if (!target) {
            setError("Pick a bot.");
            return;
        }

        if (!window.confirm(`Hand ${what} over to ${target.name}?`)) return;

        setLoading(true);
        setError(undefined);

        const res = await postAdminApi<T>({
            path: submit_path,
            body: { ...body, bot_id: target.id, instructions: with_note && note.trim() ? note : undefined },
        });

        setLoading(false);

        if (!res.success || !res.singleRes) {
            setError(res.msg || "Couldn't hand it over.");
            return;
        }

        onHandedOver({ saved: res.singleRes, msg: res.msg || `Handed over to ${target.name}.` });
    };

    return (
        <Form onSubmit={submit} className="w-full gap-3! items-stretch">
            <Stack className="gap-3! items-stretch">
                {!targets ? (
                    <Span className="text-[13px] leading-[18px] text-ink-secondary">Loading the bots...</Span>
                ) : targets.length ? (
                    <Select
                        key={targets.length}
                        label="Hand over to"
                        showLabel
                        options={targets.map((it) => ({ title: it.name, value: String(it.id), default: it.id == bot_id }))}
                        changeHandler={(value) => setBotId(Number(value))}
                    />
                ) : (
                    <Span className="text-[13px] leading-[18px] text-ink-secondary">
                        No other bot works where this runs. Add one there first.
                    </Span>
                )}
                {with_note && targets?.length ? (
                    <Textarea
                        label="Note for the brief"
                        value={note}
                        changeHandler={setNote}
                        placeholder="Anything they should know beyond the task's own brief."
                        rows={3}
                        disabled={loading}
                    />
                ) : null}
                <AddFormActions submit_label="Hand over" loading={loading} error={error} onCancel={onCancel} />
            </Stack>
        </Form>
    );
}

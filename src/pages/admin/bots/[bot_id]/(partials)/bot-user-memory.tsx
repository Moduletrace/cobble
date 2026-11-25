import { useState } from "react";
import Form from "@moduletrace/twui/form/Form";
import Span from "@moduletrace/twui/layout/Span";
import CodeEditor from "@/src/components/general/code-editor";
import postAdminApi from "@/src/layouts/bots/(functions)/post-admin-api";
import AddFormActions from "@/src/layouts/bots/(partials)/add-form-actions";

type Props = {
    bot_id: number;
    bot_name: string;
    /**
     * What the bot has saved about the user reading the panel; empty until
     * it saved anything.
     */
    memory: string;
    /**
     * A read-only user reads it alone; their own memory needs no admin.
     */
    can_edit?: boolean;
    onCancel?: () => void;
};

/**
 * What the bot remembers about this user alone (`bot_user_memories`), shown
 * in its panel: the bot writes it as it works, and the user rewrites it here.
 * It shapes how the bot works with them, never what it does.
 */
export default function BotUserMemory({
    bot_id,
    bot_name,
    memory,
    can_edit,
    onCancel,
}: Props) {
    const [text, setText] = useState(memory);
    const [loading, setLoading] = useState(false);
    const [saved, setSaved] = useState(false);
    const [error, setError] = useState<string>();

    const submit = async () => {
        if (loading) return;

        setLoading(true);
        setError(undefined);
        setSaved(false);

        try {
            const res = await postAdminApi({
                path: "bots/update-user-memory",
                body: { bot_id, memory: text },
            });

            if (res.success) {
                setSaved(true);
            } else {
                setError(res.msg || "Couldn't save its memory.");
            }
        } catch {
            setError("Couldn't save its memory.");
        } finally {
            setLoading(false);
        }
    };

    const description = `What ${bot_name} remembers about you, which only shapes how it works with you.`;

    if (!can_edit) {
        return (
            <>
                <Span className="text-[13px] leading-[18px] text-ink-secondary">
                    {description}
                </Span>
                <CodeEditor
                    title="About you"
                    content={memory || "Nothing yet."}
                    mode="markdown"
                    className="h-32"
                    readOnly
                    onChange={() => {}}
                />
            </>
        );
    }

    return (
        <Form onSubmit={submit} className="w-full gap-4! items-stretch">
            <Span className="text-[13px] leading-[18px] text-ink-secondary">
                {description}
            </Span>
            <CodeEditor
                title="About you"
                content={memory}
                mode="markdown"
                placeholder="What it should keep in mind about you..."
                info="Markdown, replaced whole. Only this bot, and only when it works with you."
                className="h-32"
                onChange={(value) => {
                    setText(value);
                    setSaved(false);
                }}
            />
            <AddFormActions
                submit_label="Save"
                loading={loading}
                error={error}
                notice={saved ? "Saved." : undefined}
                onCancel={onCancel}
            />
        </Form>
    );
}

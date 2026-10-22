import { useState } from "react";
import fetchApi from "@moduletrace/twui/utils/fetch/fetchApi";
import type { APIResponseObject } from "@moduletrace/bunext/types";
import Form from "@moduletrace/twui/form/Form";
import Span from "@moduletrace/twui/layout/Span";
import Stack from "@moduletrace/twui/layout/Stack";
import CodeEditor from "@/src/components/general/code-editor";
import { AppData } from "@/src/data/app-data";
import type { SystemPromptAppendOverview } from "@/src/functions/backend/db/app-settings/grab-system-prompt-append";
import SettingsSaveBar from "../../(partials)/settings-save-bar";

type Props = {
    appendix?: SystemPromptAppendOverview | null;
};

/**
 * The install-wide prompt appendix: saved on its own, without a reload, as
 * markdown. An empty text removes it.
 */
export default function SystemPromptAppendForm({ appendix }: Props) {
    const [overview, setOverview] = useState(appendix || undefined);
    const [dirty, setDirty] = useState(false);
    const [value, setValue] = useState(appendix?.text ?? "");
    /**
     * The editor only reads `content` when it mounts, so a discard remounts
     * it with the saved text.
     */
    const [editor_key, setEditorKey] = useState(0);
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState<{ msg?: string; error?: boolean; success?: boolean }>();

    const save = async () => {
        setLoading(true);
        setStatus(undefined);

        const res = await fetchApi<{}, APIResponseObject<SystemPromptAppendOverview>>(
            "/api/admin/settings/system-prompt-append",
            { method: "POST", body: { text: value } },
        ).catch(() => null);

        setLoading(false);

        if (!res?.success || !res.singleRes) {
            setStatus({ error: true, msg: res?.msg || `Couldn't save the appendix.` });
            return;
        }

        setOverview(res.singleRes);
        setValue(res.singleRes.text);
        setDirty(false);
        setStatus({
            success: true,
            msg: res.singleRes.text
                ? `Saved. Every bot gets it from its next reply.`
                : `Removed. Bots no longer get an appendix.`,
        });
    };

    return (
        <Form
            onSubmit={(event) => {
                event.preventDefault();
                save().catch(() => {});
            }}
            className="w-full gap-3! items-stretch"
        >
            <Stack className="w-full gap-1! items-stretch">
                <CodeEditor
                    key={`appendix-${editor_key}`}
                    mode="markdown"
                    className="h-52"
                    title="Appendix"
                    placeholder={"Never invent sources.\nAlways say which computer a task ran on."}
                    content={value}
                    onChange={(next) => {
                        setValue(next);
                        setDirty(true);
                        setStatus(undefined);
                    }}
                    info="Markdown. It sits under its own heading, after the bot's core instructions and before its workspace context and memory, so the bot's own rules there still win where they are more specific. Leave it empty to remove it."
                />
                <Span className="text-[13px] leading-[18px] text-ink-secondary">
                    {`${value.trim().length} / ${AppData.PromptMaxLength} characters`}
                </Span>
            </Stack>
            <SettingsSaveBar
                dirty={dirty}
                loading={loading}
                status={status}
                save_label="Save appendix"
                onDiscard={() => {
                    setValue(overview?.text ?? "");
                    setEditorKey((prev) => prev + 1);
                    setDirty(false);
                    setStatus(undefined);
                }}
            />
        </Form>
    );
}

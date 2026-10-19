import { useState } from "react";
import AddFormActions from "@/src/layouts/bots/(partials)/add-form-actions";
import AddModalShell from "@/src/layouts/bots/(partials)/add-modal-shell";
import Form from "@moduletrace/twui/form/Form";
import Span from "@moduletrace/twui/layout/Span";
import CodeEditor from "@/src/components/general/code-editor";
import postAdminApi from "@/src/layouts/bots/(functions)/post-admin-api";
import type { CustomToolTestPayload, PublicCustomTool } from "@/src/types";

type Props = {
    tool: PublicCustomTool;
    onClose: () => void;
};

/**
 * Runs a saved tool once with sample arguments and shows what a bot would
 * read. A script runs on the main computer, with general envs.
 */
export default function CustomToolTryModal({ tool, onClose }: Props) {
    const [args, setArgs] = useState("{}");
    const [output, setOutput] = useState<string>();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string>();

    const submit = async () => {
        if (loading) return;

        let parsed: unknown;

        try {
            parsed = JSON.parse(args || "{}");
        } catch {
            setError("The arguments aren't valid JSON.");
            return;
        }

        setLoading(true);
        setError(undefined);

        const res = await postAdminApi<CustomToolTestPayload>({
            path: "tools/test-tool",
            body: { custom_tool_id: tool.id, args: parsed },
        });

        setLoading(false);

        if (!res.success || !res.singleRes) {
            setError(res.msg || "Couldn't run the tool.");
            return;
        }

        setOutput(res.singleRes.output);
    };

    return (
        <AddModalShell
            open
            setOpen={(next) => !next && onClose()}
            title={`Try ${tool.name}`}
            description={"Runs it once and shows what a bot would read. A script runs on the main computer, with general envs."}
        >
            <Form className="w-full gap-4! items-stretch pt-4" onSubmit={submit}>
                <CodeEditor
                    mode="json"
                    className="h-28"
                    title="Arguments"
                    content={args}
                    info="Saved changes only: save the tool first."
                    onChange={(value) => setArgs(value)}
                />
                {output !== undefined ? (
                    <Span className="block font-mono text-[13px] leading-[18px] text-ink whitespace-pre-wrap break-words max-h-96 overflow-auto rounded-default-sm border border-solid border-hairline bg-paper p-3">
                        {output}
                    </Span>
                ) : null}
                <AddFormActions submit_label="Run it" loading={loading} error={error} onCancel={onClose} />
            </Form>
        </AddModalShell>
    );
}

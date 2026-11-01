import { useState } from "react";
import AddFormActions from "@/src/layouts/bots/(partials)/add-form-actions";
import AddModalShell from "@/src/layouts/bots/(partials)/add-modal-shell";
import Checkbox from "@moduletrace/twui/form/Checkbox";
import Form from "@moduletrace/twui/form/Form";
import Input from "@moduletrace/twui/form/Input";
import CodeEditor from "@/src/components/general/code-editor";
import Button from "@moduletrace/twui/layout/Button";
import Span from "@moduletrace/twui/layout/Span";
import Stack from "@moduletrace/twui/layout/Stack";
import { BrowserDefaultExcludedTools } from "@/src/dict/browser-dict";
import postAdminApi from "@/src/layouts/bots/(functions)/post-admin-api";
import type { BrowserRecord, McpServerTestPayload } from "@/src/types";
import parseTemplateLines from "@/src/utils/parse-template-lines";
import SettingsStatus from "../../(partials)/settings-status";
import McpToolToggle from "../../mcps/(partials)/mcp-tool-toggle";

type Props = {
    /**
     * Edits this browser; adds one when not given.
     */
    browser?: BrowserRecord;
    onSaved: (browsers: BrowserRecord[], msg: string) => void;
    onCancel: () => void;
};

/**
 * Adds or edits one of the user's browsers. Test connection checks the
 * form as it is and lists the tools, so any can be left out before saving.
 * Saved headers are never sent back: blank keeps them.
 */
export default function BrowserModal({ browser, onSaved, onCancel }: Props) {
    const [name, setName] = useState(browser?.name || "");
    const [description, setDescription] = useState(browser?.description || "");
    const [url, setUrl] = useState(browser?.url || "");
    const [headers, setHeaders] = useState("");
    const [clear_headers, setClearHeaders] = useState(false);
    const [excluded, setExcluded] = useState<string[]>(browser?.excluded_tools || [...BrowserDefaultExcludedTools]);
    const [enabled, setEnabled] = useState(browser?.enabled ?? true);
    const [allow_routines, setAllowRoutines] = useState(browser?.allow_routines ?? false);
    const [tools, setTools] = useState(browser?.tools || []);
    const [loading, setLoading] = useState(false);
    const [testing, setTesting] = useState(false);
    const [error, setError] = useState<string>();
    const [test, setTest] = useState<{ ok: boolean; msg: string; error?: string }>();

    const id = `browser-${browser?.id || "new"}`;

    const body = () => ({
        browser_id: browser?.id,
        name,
        description,
        url,
        headers: parseTemplateLines({ text: headers, separator: ":" }),
        clear_headers,
        excluded_tools: excluded,
        enabled,
        allow_routines,
    });

    const runTest = async () => {
        if (testing) return;

        setTesting(true);
        setTest(undefined);

        const res = await postAdminApi<McpServerTestPayload>({ path: "browsers/test-browser", body: body() });

        setTesting(false);

        if (!res.success || !res.singleRes) {
            setTest({ ok: false, msg: res.msg || "Couldn't test it." });
            return;
        }

        if (res.singleRes.ok) setTools(res.singleRes.tools);

        setTest({ ok: res.singleRes.ok, msg: res.msg || "", error: res.singleRes.error });
    };

    const submit = async () => {
        if (loading) return;
        if (!window.confirm(browser ? `Save ${browser.name}?` : `Add ${name || "this browser"}?`)) return;

        setLoading(true);
        setError(undefined);

        const res = await postAdminApi<BrowserRecord[]>({ path: "browsers/save-browser", body: body() });

        setLoading(false);

        if (!res.success || !res.singleRes) {
            setError(res.msg || "Couldn't save the browser.");
            return;
        }

        onSaved(res.singleRes, res.msg || "Saved.");
    };

    return (
        <AddModalShell
            open
            setOpen={(next) => !next && onCancel()}
            title={browser ? `Edit ${browser.name}` : "Add a browser"}
            description="A browser MCP server running beside your browser. Bots act there as you, signed in as you."
        >
            <Form className="w-full gap-4! items-stretch pt-4" onSubmit={submit}>
                <Input
                    id={`${id}-name`}
                    title="Name"
                    label="Name"
                    showLabel
                    placeholder="My laptop's Chrome"
                    defaultValue={name}
                    autoComplete="off"
                    onChange={(e) => setName(e.target.value)}
                />
                <Input
                    id={`${id}-description`}
                    title="Description"
                    label="Description"
                    showLabel
                    defaultValue={description}
                    onChange={(e) => setDescription(e.target.value)}
                />
                <Input
                    id={`${id}-url`}
                    title="URL"
                    label="URL"
                    showLabel
                    placeholder="http://host.docker.internal:8931/mcp"
                    defaultValue={url}
                    autoComplete="off"
                    info="Streamable HTTP, or SSE for older servers."
                    onChange={(e) => setUrl(e.target.value)}
                />
                <CodeEditor
                    mode="properties"
                    className="h-20"
                    title="Headers"
                    placeholder="Authorization: Bearer your-token"
                    content={headers}
                    info={
                        browser?.has_headers
                            ? "Saved and hidden. Leave blank to keep them. One per line."
                            : "Optional, for a token in front of the server. One per line. Stored encrypted."
                    }
                    onChange={(value) => setHeaders(value)}
                />
                {browser?.has_headers ? (
                    <Checkbox
                        title="Remove saved headers"
                        label="Remove the saved headers"
                        checked={clear_headers}
                        changeHandler={setClearHeaders}
                    />
                ) : null}
                <Button
                    title="Connect as the form is now, without saving"
                    type="button"
                    variant="outlined"
                    color="gray"
                    size="small"
                    loading={testing}
                    disabled={testing || loading}
                    onClick={runTest}
                    className="self-start"
                >
                    Test connection
                </Button>
                {test ? (
                    <SettingsStatus status={test.ok ? { success: true, msg: test.msg } : { error: true, msg: test.msg }} />
                ) : null}
                {test?.error ? (
                    <Span className="text-[13px] leading-[18px] text-ink whitespace-pre-wrap break-words">{test.error}</Span>
                ) : null}
                {tools.length ? (
                    <Stack className="gap-2! items-stretch">
                        <Span className="text-[13px] font-bold leading-5 text-ink">Tools bots get</Span>
                        {tools.map((tool) => (
                            <McpToolToggle
                                key={tool.name}
                                tool={tool}
                                on={!excluded.includes(tool.name)}
                                onChange={(on) =>
                                    setExcluded((prev) =>
                                        on ? prev.filter((name) => name != tool.name) : [...prev, tool.name],
                                    )
                                }
                            />
                        ))}
                    </Stack>
                ) : null}
                <Checkbox title="On" label="On: bots get its tools" checked={enabled} changeHandler={setEnabled} />
                <Checkbox
                    title="Routines"
                    label="Let my routines use it. Nobody watches a routine, and it can't ask you first."
                    checked={allow_routines}
                    changeHandler={setAllowRoutines}
                />
                <AddFormActions
                    submit_label={browser ? "Save and connect" : "Add and connect"}
                    loading={loading}
                    error={error}
                    onCancel={onCancel}
                />
            </Form>
        </AddModalShell>
    );
}

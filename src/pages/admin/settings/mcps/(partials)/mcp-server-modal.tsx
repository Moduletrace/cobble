import { useState } from "react";
import AddFormActions from "@/src/layouts/bots/(partials)/add-form-actions";
import AddModalShell from "@/src/layouts/bots/(partials)/add-modal-shell";
import Checkbox from "@moduletrace/twui/form/Checkbox";
import Form from "@moduletrace/twui/form/Form";
import Input from "@moduletrace/twui/form/Input";
import Select from "@moduletrace/twui/form/Select";
import CodeEditor from "@/src/components/general/code-editor";
import Button from "@moduletrace/twui/layout/Button";
import Span from "@moduletrace/twui/layout/Span";
import Stack from "@moduletrace/twui/layout/Stack";
import { McpTransports, type McpTransport } from "@/src/dict/mcp-dict";
import postAdminApi from "@/src/layouts/bots/(functions)/post-admin-api";
import type { McpServersOverviewPayload, PublicMcpServer } from "@/src/types";
import parseTemplateLines, { templateLines } from "@/src/utils/parse-template-lines";
import McpToolToggle from "./mcp-tool-toggle";

type Props = {
    /**
     * Edits this server; adds one when not given.
     */
    server?: PublicMcpServer;
    busy?: boolean;
    /**
     * Runs a stdio server's setup again.
     */
    onReinstall?: () => void;
    onSaved: (overview: McpServersOverviewPayload, msg: string) => void;
    onCancel: () => void;
};

/**
 * Adds or edits an MCP server (super admins): a remote one by URL and
 * headers, or a stdio one by the command that starts it on this server,
 * the setup that installs what it needs, and the env it gets. Values can
 * use `{{env.KEY}}`. Saving connects and lists its tools; each can be
 * left out.
 */
export default function McpServerModal({ server, busy, onReinstall, onSaved, onCancel }: Props) {
    const [name, setName] = useState(server?.name || "");
    const [description, setDescription] = useState(server?.description || "");
    const [transport, setTransport] = useState<McpTransport>(server?.transport || "remote");
    const [url, setUrl] = useState(server?.url || "");
    const [headers, setHeaders] = useState(templateLines({ map: server?.headers, separator: ":" }));
    const [command, setCommand] = useState(server?.command || "");
    const [setup_command, setSetupCommand] = useState(server?.setup_command || "");
    const [env, setEnv] = useState(templateLines({ map: server?.env, separator: "=" }));
    const [excluded, setExcluded] = useState(server?.excluded_tools || []);
    const [enabled, setEnabled] = useState(server?.enabled ?? true);
    const [all_bots, setAllBots] = useState(server?.access.all_bots ?? false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string>();

    const id = `mcp-${server?.id || "new"}`;

    const submit = async () => {
        if (loading) return;
        if (!window.confirm(server ? `Save ${server.name}?` : `Add ${name || "this MCP server"}?`)) return;

        setLoading(true);
        setError(undefined);

        const res = await postAdminApi<McpServersOverviewPayload>({
            path: "mcps/save-mcp",
            body: {
                mcp_server_id: server?.id,
                name,
                description,
                transport,
                url,
                headers: parseTemplateLines({ text: headers, separator: ":" }),
                command,
                setup_command,
                env: parseTemplateLines({ text: env, separator: "=" }),
                excluded_tools: excluded,
                enabled,
                all_bots,
            },
        });

        setLoading(false);

        if (!res.success || !res.singleRes) {
            setError(res.msg || "Couldn't save the MCP server.");
            return;
        }

        onSaved(res.singleRes, res.msg || "Saved.");
    };

    return (
        <AddModalShell
            open
            setOpen={(next) => !next && onCancel()}
            title={server ? `Edit ${server.name}` : "Add an MCP server"}
            description={"Bots get its tools once it's attached to them. Saving connects and lists them."}
        >
            <Form className="w-full gap-4! items-stretch pt-4" onSubmit={submit}>
                <Input
                    id={`${id}-name`}
                    title="Name"
                    label="Name"
                    showLabel
                    placeholder="GitHub"
                    defaultValue={name}
                    autoComplete="off"
                    onChange={(e) => setName(e.target.value)}
                />
                <Input
                    id={`${id}-description`}
                    title="Description"
                    label="Description"
                    showLabel
                    placeholder="Issues and pull requests in the company's repositories"
                    defaultValue={description}
                    onChange={(e) => setDescription(e.target.value)}
                />
                <Select
                    id={`${id}-transport`}
                    title="How to reach it"
                    label="How to reach it"
                    showLabel
                    options={McpTransports.map((t) => ({ value: t.value, title: t.title, default: t.value == transport }))}
                    changeHandler={(value) => setTransport(String(value) as McpTransport)}
                />
                {transport == "remote" ? (
                    <>
                        <Input
                            id={`${id}-url`}
                            title="URL"
                            label="URL"
                            showLabel
                            placeholder="https://mcp.example.com/mcp"
                            defaultValue={url}
                            autoComplete="off"
                            info="Streamable HTTP, or SSE for older servers."
                            onChange={(e) => setUrl(e.target.value)}
                        />
                        <CodeEditor
                            mode="properties"
                            className="h-24"
                            title="Headers"
                            placeholder={"Authorization: Bearer {{env.GITHUB_TOKEN}}"}
                            content={headers}
                            info="One per line. Put secrets in Settings, under Environment, and use them as {{env.KEY}}."
                            onChange={(value) => setHeaders(value)}
                        />
                    </>
                ) : (
                    <>
                        <CodeEditor
                            title="Command"
                            mode="sh"
                            className="h-24"
                            placeholder="bunx -y @modelcontextprotocol/server-github"
                            content={command}
                            info="Runs on this server with its shell, in the server's own folder, as the app's user. Only add commands you trust."
                            onChange={setCommand}
                        />
                        <CodeEditor
                            title="Setup command"
                            mode="sh"
                            className="h-32"
                            placeholder="bun add @modelcontextprotocol/server-github"
                            content={setup_command}
                            info="Installs what the command needs, in the same folder (kept across updates). Runs before the first start and whenever it changes. Prefer installs into the folder: system packages go when the app is updated."
                            onChange={setSetupCommand}
                        />
                        <CodeEditor
                            mode="properties"
                            className="h-24"
                            title="Env"
                            placeholder={"GITHUB_PERSONAL_ACCESS_TOKEN={{env.GITHUB_TOKEN}}"}
                            content={env}
                            info="One KEY=value per line: the only envs it gets, besides PATH and HOME."
                            onChange={(value) => setEnv(value)}
                        />
                        {server?.id && onReinstall ? (
                            <Button
                                title="Run the setup command again"
                                type="button"
                                variant="outlined"
                                color="gray"
                                size="small"
                                className="self-start"
                                disabled={busy || loading}
                                onClick={onReinstall}
                            >
                                Reinstall
                            </Button>
                        ) : null}
                    </>
                )}
                {server?.status == "error" && server.last_error ? (
                    <Span className="text-[13px] leading-[18px] text-ink whitespace-pre-wrap break-words">
                        {server.last_error}
                    </Span>
                ) : null}
                {server?.tools.length ? (
                    <Stack className="gap-2! items-stretch">
                        <Span className="text-[13px] font-bold leading-5 text-ink">Tools bots get</Span>
                        {server.tools.map((tool) => (
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
                    title="Every bot"
                    label="Every bot, the coordinator included"
                    checked={all_bots}
                    changeHandler={setAllBots}
                />
                <AddFormActions
                    submit_label={server ? "Save and connect" : "Add and connect"}
                    loading={loading}
                    error={error}
                    onCancel={onCancel}
                />
            </Form>
        </AddModalShell>
    );
}

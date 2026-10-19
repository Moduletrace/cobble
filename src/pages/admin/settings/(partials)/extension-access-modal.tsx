import { useState } from "react";
import AddFormActions from "@/src/layouts/bots/(partials)/add-form-actions";
import AddModalShell from "@/src/layouts/bots/(partials)/add-modal-shell";
import Checkbox from "@moduletrace/twui/form/Checkbox";
import Form from "@moduletrace/twui/form/Form";
import SearchSelect from "@moduletrace/twui/form/SearchSelect";
import postAdminApi from "@/src/layouts/bots/(functions)/post-admin-api";
import type { ExtensionAccess, ExtensionTargets } from "@/src/types";

type Props<T> = {
    /**
     * The MCP server's or tool's id and name.
     */
    id: number;
    name: string;
    access: ExtensionAccess;
    targets: ExtensionTargets;
    /**
     * Under `/api/admin/`.
     */
    path: "mcps/set-mcp-access" | "tools/set-tool-access";
    onSaved: (overview: T, msg: string) => void;
    onCancel: () => void;
};

/**
 * Who gets an MCP server or tool: the bots and workspaces picked here.
 * "Every bot" (super admins only) gives it to every bot now and every new
 * one; each can still drop it. A workspace gives it to every bot in
 * it, there.
 */
export default function ExtensionAccessModal<T extends { [k: string]: any }>({
    id,
    name,
    access,
    targets,
    path,
    onSaved,
    onCancel,
}: Props<T>) {
    const [all_bots, setAllBots] = useState(access.all_bots);
    const [bot_ids, setBotIds] = useState(access.bot_ids);
    const [workspace_ids, setWorkspaceIds] = useState(access.workspace_ids);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string>();

    const submit = async () => {
        if (loading || !window.confirm(`Save who gets ${name}?`)) return;

        setLoading(true);
        setError(undefined);

        const res = await postAdminApi<T>({
            path,
            body: { id, bot_ids, workspace_ids, all_bots: targets.can_edit ? all_bots : undefined },
        });

        setLoading(false);

        if (!res.success || !res.singleRes) {
            setError(res.msg || "Couldn't save who gets it.");
            return;
        }

        onSaved(res.singleRes, res.msg || "Saved.");
    };

    const ids = (value: unknown) => (Array.isArray(value) ? value : value ? [value] : []).map(Number);

    return (
        <AddModalShell
            open
            setOpen={(next) => !next && onCancel()}
            title={`Who gets ${name}`}
            description={"A bot gets it everywhere it works; a workspace gives it to every bot in it, there."}
        >
            <Form className="w-full gap-4! items-stretch pt-4" onSubmit={submit}>
                {targets.can_edit ? (
                    <Checkbox
                        title="Every bot"
                        label="Every bot by default: every bot now and every new one, the coordinator included. Each can still drop it."
                        checked={all_bots}
                        changeHandler={setAllBots}
                    />
                ) : access.all_bots ? (
                    <Checkbox title="Every bot" label="Every bot by default (only a super admin changes this)" checked readOnly />
                ) : null}
                <SearchSelect
                    id={`${path}-${id}-bots`}
                    title="Bots"
                    label="Bots"
                    showLabel
                    multiple
                    placeholder="Pick the bots that get it"
                    options={targets.bots.map((bot) => ({
                        value: String(bot.id),
                        title: bot.role ? `${bot.name} (${bot.role})` : bot.name,
                    }))}
                    defaultValues={bot_ids.map(String)}
                    info="They get it everywhere they work."
                    changeHandler={(value) => setBotIds(ids(value))}
                />
                <SearchSelect
                    id={`${path}-${id}-workspaces`}
                    title="Workspaces"
                    label="Workspaces"
                    showLabel
                    multiple
                    placeholder="Pick the workspaces that get it"
                    options={targets.workspaces.map((workspace) => ({
                        value: String(workspace.id),
                        title: workspace.name,
                    }))}
                    defaultValues={workspace_ids.map(String)}
                    info="Every bot in these gets it, there."
                    changeHandler={(value) => setWorkspaceIds(ids(value))}
                />
                <AddFormActions submit_label="Save" loading={loading} error={error} onCancel={onCancel} />
            </Form>
        </AddModalShell>
    );
}

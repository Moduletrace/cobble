import { useState } from "react";
import AddFormActions from "@/src/layouts/bots/(partials)/add-form-actions";
import AddModalShell from "@/src/layouts/bots/(partials)/add-modal-shell";
import Checkbox from "@moduletrace/twui/form/Checkbox";
import Form from "@moduletrace/twui/form/Form";
import SearchSelect from "@moduletrace/twui/form/SearchSelect";
import postAdminApi from "@/src/layouts/bots/(functions)/post-admin-api";
import type {
    ConnectorAccess,
    ConnectorRecord,
    ExtensionTargets,
} from "@/src/types";
import SettingsStatus from "../../(partials)/settings-status";
import Spacer from "@moduletrace/twui/layout/Spacer";

type Props = {
    connector: ConnectorRecord;
    access: ConnectorAccess | undefined;
    targets: ExtensionTargets;
    /**
     * The bots the viewer reaches, for their own runs there.
     */
    bots: { id: number; name: string }[];
    onSaved: (msg: string) => void;
    onCancel: () => void;
};

/**
 * Where one connector reaches. A bot picked here is personal: only the runs
 * of whoever picked it see the connector there. Workspaces and every bot
 * are the install's, so a super admin sets those.
 */
export default function ConnectorAccessModal({
    connector,
    access,
    targets,
    bots,
    onSaved,
    onCancel,
}: Props) {
    const [all_bots, setAllBots] = useState(Boolean(connector.all_bots));
    const [bot_ids, setBotIds] = useState<number[]>(access?.bot_ids || []);
    const [workspace_ids, setWorkspaceIds] = useState<number[]>(
        access?.workspace_ids || [],
    );
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string>();

    const submit = async () => {
        if (loading) return;

        setLoading(true);
        setError(undefined);

        if (targets.can_edit) {
            const saved = await postAdminApi({
                path: "connectors/set-access",
                body: { connector_id: connector.id, workspace_ids, all_bots },
            });

            if (!saved.success) {
                setLoading(false);
                setError(saved.msg || "Couldn't save where it reaches.");
                return;
            }
        }

        const before = new Set(access?.bot_ids || []);
        const after = new Set(bot_ids);
        const changes = [
            ...[...after]
                .filter((bot_id) => !before.has(bot_id))
                .map((bot_id) => ({ bot_id, attached: true })),
            ...[...before]
                .filter((bot_id) => !after.has(bot_id))
                .map((bot_id) => ({ bot_id, attached: false })),
        ];

        for (const change of changes) {
            const res = await postAdminApi({
                path: "connectors/set-bot",
                body: {
                    bot_id: change.bot_id,
                    connector_id: connector.id,
                    attached: change.attached,
                },
            });

            if (!res.success) {
                setLoading(false);
                setError(res.msg || "Couldn't change one of your bots.");
                return;
            }
        }

        setLoading(false);

        onSaved(`Saved where ${connector.name} reaches.`);
    };

    const ids = (value: unknown) =>
        (Array.isArray(value) ? value : value ? [value] : []).map(Number);

    return (
        <AddModalShell
            open
            setOpen={(next) => !next && onCancel()}
            title={`Who gets ${connector.name}`}
            description={
                "A bot picked here is yours: it reaches the connector only in your runs there, with your own accounts. A workspace reaches everyone working in it, with every account connected for this connector. Every bot reaches the whole install, each user with their own accounts."
            }
        >
            <Form
                className="w-full gap-4! items-stretch pt-4"
                onSubmit={submit}
            >
                <SearchSelect
                    id={`connector-${connector.id}-my-bots`}
                    title="Your bots"
                    label="Your bots"
                    showLabel
                    multiple
                    placeholder="Pick the bots that get it, for you"
                    options={bots.map((bot) => ({
                        value: String(bot.id),
                        title: bot.name,
                    }))}
                    defaultValues={bot_ids.map(String)}
                    info="Only your own runs on these bots see it, nobody else's."
                    changeHandler={(value) => setBotIds(ids(value))}
                />
                {targets.can_edit ? (
                    <>
                        <Checkbox
                            title="Every bot"
                            label="Every bot, for every user: everyone's runs reach it, with their own accounts."
                            checked={all_bots}
                            changeHandler={setAllBots}
                        />
                        <Spacer className="h-4" />
                        <SearchSelect
                            id={`connector-${connector.id}-workspaces`}
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
                            info="Everyone working in these reaches it, with their own accounts."
                            changeHandler={(value) =>
                                setWorkspaceIds(ids(value))
                            }
                        />
                    </>
                ) : null}
                <AddFormActions
                    submit_label="Save"
                    loading={loading}
                    onCancel={onCancel}
                />
                <SettingsStatus
                    status={error ? { error: true, msg: error } : undefined}
                />
            </Form>
        </AddModalShell>
    );
}

import { useContext, useState } from "react";
import Button from "@moduletrace/twui/layout/Button";
import Span from "@moduletrace/twui/layout/Span";
import Stack from "@moduletrace/twui/layout/Stack";
import { Plus } from "lucide-react";
import type { BotWithLastMessage, WorkspaceBot } from "@/src/types";
import { AddFlowContext } from "@/src/layouts/bots/(data)/add-flow-context";
import postAdminApi from "@/src/layouts/bots/(functions)/post-admin-api";
import SettingsGroup from "@/src/pages/admin/settings/(partials)/settings-group";
import SettingsStatus from "@/src/pages/admin/settings/(partials)/settings-status";
import InlineAddSelect from "@/src/components/general/inline-add-select";
import WorkspaceBotModal from "./workspace-bot-modal";
import WorkspaceBotRow from "./workspace-bot-row";

type Props = {
    workspace_id: number;
    workspace_name: string;
    /**
     * The workspace's bots (the coordinator included, always a member).
     */
    bots: WorkspaceBot[];
    /**
     * Every bot the user has.
     */
    all_bots: BotWithLastMessage[];
};

/**
 * Which bots work here. A bot can be in any number of workspaces; in each
 * it can have instructions and memory of its own. Changes reload the
 * page, so the rail shows the new crew.
 */
export default function WorkspaceBotsGroup({ workspace_id, workspace_name, bots: initial, all_bots }: Props) {
    const { openForm } = useContext(AddFlowContext);
    const [bots, setBots] = useState(initial);
    const [busy_id, setBusyId] = useState<number | "add">();
    const [admin_busy_id, setAdminBusyId] = useState<number>();
    const [editing, setEditing] = useState<WorkspaceBot>();
    const [error, setError] = useState<string>();

    const workers = bots.filter((bot) => bot.kind != "coordinator");
    const addable = all_bots.filter((bot) => bot.kind != "coordinator" && !bots.some((b) => b.id == bot.id));

    const change = async ({ path, bot_id }: { path: "add-bot" | "remove-bot"; bot_id: number }) => {
        setBusyId(path == "add-bot" ? "add" : bot_id);
        setError(undefined);

        const res = await postAdminApi<WorkspaceBot>({
            path: `workspaces/${path}`,
            body: { workspace_id, bot_id },
        });

        if (res.success) {
            window.location.reload();
            return;
        }

        setBusyId(undefined);
        setError(res.msg || "That didn't work.");
    };

    /**
     * Makes a bot this workspace's admin, or takes that away, in place.
     */
    const toggleAdmin = async ({ bot }: { bot: WorkspaceBot }) => {
        const given = !bot.is_admin;
        const name = bot.name || "this bot";

        if (
            !window.confirm(
                given
                    ? `Make ${name} the admin of ${workspace_name}? It will hand tasks to the other bots here, set their instructions here, run the workspace's tasks and keep its context.`
                    : `Take away ${name}'s admin role in ${workspace_name}?`,
            )
        ) {
            return;
        }

        setAdminBusyId(Number(bot.id));
        setError(undefined);

        const res = await postAdminApi<WorkspaceBot>({
            path: "bots/set-bot-type",
            body: { workspace_id, bot_id: bot.id, bot_type: "admin", given },
        });

        setAdminBusyId(undefined);

        if (res.success && res.payload) {
            setBots(res.payload);
            return;
        }

        setError(res.msg || "That didn't work.");
    };

    return (
        <SettingsGroup
            id="bots"
            title="Bots"
            description="The coordinator works in every workspace. Add the bots this one needs; each keeps its skills and follows this workspace's ways here. Make one the admin to have it lead the others here."
        >
            <Stack className="w-full py-1 gap-0! items-stretch rounded-default border border-solid border-hairline bg-surface">
                {workers.map((bot) => (
                    <WorkspaceBotRow
                        key={bot.id}
                        bot={bot}
                        settings_href={
                            bot.kind == "coordinator"
                                ? undefined
                                : `/admin/settings/bots/${bot.id}`
                        }
                        chat_href={`/admin/workspaces/${workspace_id}/bots/${bot.id}`}
                        removing={busy_id == bot.id}
                        toggling_admin={admin_busy_id == bot.id}
                        onToggleAdmin={() => toggleAdmin({ bot })}
                        onEdit={() => setEditing(bot)}
                        onRemove={() => change({ path: "remove-bot", bot_id: Number(bot.id) })}
                    />
                ))}
                {workers.length ? null : (
                    <Span className="px-4 py-4 text-[13px] leading-[18px] text-ink-secondary">
                        No bots here yet. Only the coordinator works in this workspace.
                    </Span>
                )}
            </Stack>
            <InlineAddSelect
                id="workspace-add-bot"
                noun="bot"
                options={addable.map((bot) => ({ value: String(bot.id), title: bot.name || `Bot ${bot.id}` }))}
                loading={busy_id == "add"}
                onAdd={({ value }) => change({ path: "add-bot", bot_id: Number(value) })}
            />
            <Button
                title="Add a new bot to this workspace"
                type="button"
                variant="ghost"
                color="gray"
                size="small"
                onClick={() => openForm({ kind: "bot" })}
                className="self-start gap-1!"
            >
                <Plus size={14} aria-hidden />
                New bot
            </Button>
            <SettingsStatus status={error ? { error: true, msg: error } : undefined} />
            {editing ? (
                <WorkspaceBotModal
                    workspace_id={workspace_id}
                    workspace_name={workspace_name}
                    bot={editing}
                    onClose={() => setEditing(undefined)}
                    onSaved={setBots}
                />
            ) : null}
        </SettingsGroup>
    );
}

import { useEffect, useState } from "react";
import Input from "@moduletrace/twui/form/Input";
import Button from "@moduletrace/twui/layout/Button";
import Span from "@moduletrace/twui/layout/Span";
import Stack from "@moduletrace/twui/layout/Stack";
import { Plus } from "lucide-react";
import type { BotWithLastMessage, WorkspaceBot } from "@/src/types";
import SettingsStatus from "@/src/pages/admin/settings/(partials)/settings-status";
import postAdminApi from "../(functions)/post-admin-api";
import AddModalShell from "./add-modal-shell";
import LinkBotRow from "./link-bot-row";

type Props = {
    open: boolean;
    setOpen: (open: boolean) => void;
    workspace_id: number;
    workspace_name?: string | null;
    /**
     * Opens the Add-a-bot form over this modal.
     */
    onNewBot: () => void;
};

/**
 * The workspace rail's "+": the crew's workers not in the workspace yet,
 * each added with one click, and "New bot" for one that doesn't exist.
 * Adding reloads the page, so the rail and the dashboard show the new crew.
 */
export default function LinkBotsModal({ open, setOpen, workspace_id, workspace_name, onNewBot }: Props) {
    const [bots, setBots] = useState<BotWithLastMessage[]>();
    const [query, setQuery] = useState("");
    const [linking_id, setLinkingId] = useState<number>();
    const [error, setError] = useState<string>();

    useEffect(() => {
        if (!open) return;

        setError(undefined);

        postAdminApi<BotWithLastMessage>({ path: "workspaces/linkable-bots", body: { workspace_id } }).then((res) => {
            if (res.success) {
                setBots(res.payload || []);
                return;
            }

            setBots([]);
            setError(res.msg || "Couldn't load the bots.");
        });
    }, [open, workspace_id]);

    const link = async ({ bot }: { bot: BotWithLastMessage }) => {
        if (!window.confirm(`Add ${bot.name || "this bot"} to ${workspace_name || "this workspace"}?`)) return;

        setLinkingId(Number(bot.id));
        setError(undefined);

        const res = await postAdminApi<WorkspaceBot>({
            path: "workspaces/add-bot",
            body: { workspace_id, bot_id: bot.id },
        });

        if (res.success) {
            window.location.reload();
            return;
        }

        setLinkingId(undefined);
        setError(res.msg || "That didn't work.");
    };

    const search = query.trim().toLowerCase();
    const found = (bots || []).filter(
        (bot) => !search || `${bot.name} ${bot.role || ""}`.toLowerCase().includes(search),
    );

    return (
        <AddModalShell
            open={open}
            setOpen={setOpen}
            title={`Add bots to ${workspace_name || "this workspace"}`}
            description="Bots here work with the workspace's context, computers and models."
        >
            {bots?.length ? (
                <Input
                    id="link-bots-search"
                    title="Search bots"
                    placeholder="Search by name or job"
                    autoComplete="off"
                    defaultValue={query}
                    onChange={(e) => setQuery(e.target.value)}
                    wrapperWrapperProps={{ className: "mt-4" }}
                />
            ) : null}
            <Stack className="w-full mt-2 max-h-[50vh] overflow-y-auto gap-0! items-stretch">
                {found.map((bot) => (
                    <LinkBotRow
                        key={bot.id}
                        bot={bot}
                        linking={linking_id == bot.id}
                        disabled={Boolean(linking_id)}
                        onLink={() => link({ bot })}
                    />
                ))}
                {!bots || found.length ? null : (
                    <Span className="px-3 py-6 text-[13px] leading-[18px] text-ink-secondary">
                        {search ? `No bot matches "${query.trim()}".` : "Every bot is already here."}
                    </Span>
                )}
            </Stack>
            <SettingsStatus status={error ? { error: true, msg: error } : undefined} />
            <Button
                title="Create a new bot for this workspace"
                type="button"
                variant="ghost"
                color="gray"
                size="small"
                onClick={onNewBot}
                className="self-start gap-1! mt-3"
            >
                <Plus size={14} aria-hidden />
                New bot
            </Button>
        </AddModalShell>
    );
}

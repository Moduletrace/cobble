import { useEffect, useState } from "react";
import Modal from "@moduletrace/twui/elements/Modal";
import Loading from "@moduletrace/twui/elements/Loading";
import H2 from "@moduletrace/twui/layout/H2";
import Span from "@moduletrace/twui/layout/Span";
import Stack from "@moduletrace/twui/layout/Stack";
import { NotebookPen } from "lucide-react";
import type { BUN_SQLITE_COBBLE_WORKSPACES } from "@/db/types/db";
import type { BotWithLastMessage } from "@/src/types";
import WorkspaceBotForm from "@/src/components/general/workspace-bot-form";
import useWorkspaceBotInstructions from "../(hooks)/use-workspace-bot-instructions";
import HeaderMenuItem from "./header-menu-item";

type Props = {
    bot: BotWithLastMessage;
    workspace: BUN_SQLITE_COBBLE_WORKSPACES;
    on_open?: () => void;
};

/**
 * The header menu's row, in a workspace conversation, that opens what the
 * bot has for this workspace alone: its instructions here and its memory
 * here (crew managers). Both load when it opens, so it shows the bot's
 * own latest edits.
 */
export default function BotWorkspaceInstructionsModal({ bot, workspace, on_open }: Props) {
    const [open, setOpen] = useState(false);
    const name = bot.name || "This bot";
    const place = workspace.name || "this workspace";
    const { instructions, error } = useWorkspaceBotInstructions({
        workspace_id: Number(workspace.id),
        bot_id: Number(bot.id),
        enabled: open,
    });

    useEffect(() => {
        if (open) on_open?.();
    }, [open]);

    return (
        <Modal
            target={
                <HeaderMenuItem
                    icon={NotebookPen}
                    title="Instructions here"
                    description={`${name}'s instructions and memory in ${place}`}
                />
            }
            targetWrapperProps={{ className: "w-full" }}
            open={open}
            setOpen={setOpen}
            className="max-w-lg bg-paper p-6"
        >
            <Stack className="w-full gap-1! items-stretch">
                <H2 className="text-lg! leading-6! tracking-normal! font-bold text-ink">{`${name} in ${place}`}</H2>
                <Span className="text-[13px] leading-[18px] text-ink-secondary">
                    {`On top of ${name}'s core instructions, which apply everywhere. These apply only in ${place}, and ${name} updates them itself as it learns how this workspace works.`}
                </Span>
            </Stack>
            {!open ? null : instructions ? (
                <WorkspaceBotForm
                    workspace_id={Number(workspace.id)}
                    bot_id={Number(bot.id)}
                    bot_name={bot.name}
                    system_prompt={instructions.system_prompt}
                    memory={instructions.memory}
                    onCancel={() => setOpen(false)}
                    onSaved={() => setOpen(false)}
                />
            ) : error ? (
                <Span className="py-6 text-[13px] leading-[18px] text-ink-secondary">{error}</Span>
            ) : (
                <Stack className="w-full py-10 items-center">
                    <Loading />
                </Stack>
            )}
        </Modal>
    );
}

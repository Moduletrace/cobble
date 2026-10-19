import AddModalShell from "@/src/layouts/bots/(partials)/add-modal-shell";
import BotForm from "@/src/layouts/bots/(partials)/bot-form";
import type { BotWithLastMessage } from "@/src/types";

type Props = {
    /**
     * Open while set.
     */
    bot?: BotWithLastMessage;
    onClose: () => void;
};

/**
 * Edits a bot in a modal, with the same form as adding one (and as the
 * chat header's avatar).
 */
export default function BotEditModal({ bot, onClose }: Props) {
    return (
        <AddModalShell
            open={Boolean(bot)}
            setOpen={(open) => !open && onClose()}
            title={`Edit ${bot?.name || "the bot"}`}
            description={
                bot?.kind == "coordinator"
                    ? "The coordinator keeps its name. Give it a picture, or change its core instructions."
                    : "Its core instructions apply everywhere. What it does in one workspace is set on that workspace's page."
            }
        >
            {bot ? <BotForm key={bot.id} bot={bot} onCancel={onClose} /> : null}
        </AddModalShell>
    );
}

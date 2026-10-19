import { useState } from "react";
import type { BUN_SQLITE_COBBLE_BOTS } from "@/db/types/db";
import BotForm from "@/src/layouts/bots/(partials)/bot-form";
import type { BotWithLastMessage } from "@/src/types";
import SettingsGroup from "../../../(partials)/settings-group";
import SettingsStatus from "../../../(partials)/settings-status";

type Props = {
    bot: BotWithLastMessage;
    onSaved: (bot: BUN_SQLITE_COBBLE_BOTS) => void;
};

/**
 * The bot's picture, name, job, colour and core instructions, edited in
 * place. The same form as adding a bot, without a modal around it.
 */
export default function BotDetailsGroup({ bot, onSaved }: Props) {
    const [status, setStatus] = useState<{ success?: boolean; msg?: string }>();
    const is_coordinator = bot.kind == "coordinator";

    return (
        <SettingsGroup
            id="details"
            title="Details"
            description={
                is_coordinator
                    ? "The coordinator keeps its name and has no colour. Its core instructions apply everywhere."
                    : "The bot's picture, name, job, colour and core instructions. These apply in its own chat and wherever it has no workspace instructions."
            }
        >
            <BotForm
                bot={bot}
                onSaved={(saved) => {
                    onSaved(saved);
                    setStatus({ success: true, msg: "Saved." });
                }}
            />
            <SettingsStatus status={status} />
        </SettingsGroup>
    );
}

import { useContext } from "react";
import Button from "@moduletrace/twui/layout/Button";
import { Plus } from "lucide-react";
import { AppContext } from "@/src/pages/__root";
import { AddFlowContext } from "@/src/layouts/bots/(data)/add-flow-context";
import useSettingsList from "../../(hooks)/use-settings-list";
import SettingsGroup from "../../(partials)/settings-group";
import SettingsList from "../../(partials)/settings-list";
import SettingsStatus from "../../(partials)/settings-status";
import BotSettingsRow from "../(partials)/bot-settings-row";

/**
 * The user's crew, coordinator first. A row opens that bot's settings
 * page; chat with it, or delete a worker.
 */
export default function BotsSettingsSection() {
    const { pageProps } = useContext(AppContext);
    const { openForm } = useContext(AddFlowContext);
    const { items, busy, status, remove } = useSettingsList({ items: pageProps?.bots || [] });

    return (
        <SettingsGroup
            title="Your crew"
            description="The coordinator stays. Deleting a bot removes its conversations, tasks and models."
        >
            <SettingsList is_empty={!items.length} empty="No bots yet.">
                {items.map((bot) => (
                    <BotSettingsRow
                        key={bot.id}
                        bot={bot}
                        busy={busy}
                        onDelete={() =>
                            remove({
                                id: bot.id,
                                path: "bots/delete-bot",
                                body: { bot_id: bot.id },
                                confirm: `Delete ${bot.name || "this bot"}? Its conversations, tasks and models go with it.`,
                            })
                        }
                    />
                ))}
            </SettingsList>
            <Button
                title="Add a bot"
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
            <SettingsStatus status={status} />
        </SettingsGroup>
    );
}

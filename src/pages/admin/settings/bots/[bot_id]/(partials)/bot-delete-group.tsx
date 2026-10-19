import { useState } from "react";
import Button from "@moduletrace/twui/layout/Button";
import postAdminApi from "@/src/layouts/bots/(functions)/post-admin-api";
import type { BotWithLastMessage } from "@/src/types";
import SettingsGroup from "../../../(partials)/settings-group";
import SettingsStatus from "../../../(partials)/settings-status";

type Props = {
    bot: BotWithLastMessage;
};

/**
 * Deletes a worker with its conversations, tasks and models. The
 * coordinator is never deleted.
 */
export default function BotDeleteGroup({ bot }: Props) {
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState<{ error?: boolean; msg?: string }>();
    const name = bot.name || "this bot";

    const remove = async () => {
        if (
            !window.confirm(
                `Delete ${name}? Its conversations, tasks and models go with it.`,
            )
        )
            return;

        setLoading(true);
        setStatus(undefined);

        const res = await postAdminApi({
            path: "bots/delete-bot",
            body: { bot_id: bot.id },
        });

        if (res.success) {
            window.location.href = "/admin/settings/bots";
            return;
        }

        setLoading(false);
        setStatus({ error: true, msg: res.msg || "Couldn't delete the bot." });
    };

    return (
        <SettingsGroup
            id="delete"
            title="Delete"
            description="Deletes the bot with its conversations, tasks and models."
        >
            <Button
                title={`Delete ${name}`}
                type="button"
                variant="outlined"
                color="gray"
                size="small"
                loading={loading}
                disabled={loading}
                onClick={remove}
                className="self-start"
            >
                Delete bot
            </Button>
            <SettingsStatus status={status} />
        </SettingsGroup>
    );
}

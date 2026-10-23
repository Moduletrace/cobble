import { useContext } from "react";
import Button from "@moduletrace/twui/layout/Button";
import { CircleStop } from "lucide-react";
import { BotStopButtonLabel } from "@/src/dict/bot-queue-dict";
import { StopBotContext } from "../(data)/stop-bot-context";
import HeaderMenuItem from "./header-menu-item";

type Props = {
    /**
     * Whose work stops, named in the tooltip so it's clear this pulls the
     * bot's plug everywhere the user chats with it.
     */
    bot_name?: string | null;
    /**
     * Shown as a row in the conversation header's menu instead of a button
     * in the thinking row.
     */
    menu?: boolean;
    /**
     * The caller already knows there's nothing to pull (a row that says the
     * bot is only collecting the message), so the button sits out.
     */
    disabled?: boolean;
};

/**
 * Pulls the plug on the bot for the signed-in user: its queued and running
 * work stops wherever they chat with it, so a bot stuck waiting for a model
 * (or anything else) comes back. The thinking row carries it while
 * something is running; the header's menu carries it too, disabled when
 * there's nothing to stop.
 */
export default function StopBotButton({ bot_name, menu, disabled }: Props) {
    const { stop, stopping, error, can_stop } = useContext(StopBotContext);
    const name = bot_name || "the bot";
    const off = Boolean(disabled) || !can_stop || stopping;
    const title = error
        ? error
        : off && !stopping
          ? `Nothing of ${name}'s is running for you.`
          : `Stop ${name}. Its queued and running work stops, everywhere you chat with it.`;

    if (menu) {
        return (
            <HeaderMenuItem
                icon={CircleStop}
                title={BotStopButtonLabel}
                description={title}
                hint={stopping ? "Stopping" : undefined}
                loading={stopping}
                disabled={off}
                onClick={() => {
                    void stop();
                }}
            />
        );
    }

    return (
        <Button
            title={title}
            aria-label={title}
            type="button"
            variant="ghost"
            color="text"
            size="smaller"
            disabled={off}
            loading={stopping}
            loadingIconSize="small"
            beforeIcon={<CircleStop size={14} aria-hidden />}
            onClick={() => {
                void stop();
            }}
            className="shrink-0 text-ink-secondary dark:text-ink-secondary hover:text-ink hover:dark:text-ink hover:bg-sunken hover:dark:bg-sunken rounded-default transition-colors duration-[var(--m-fast)] focus-visible:ring-2 focus-visible:ring-ink"
        >
            {BotStopButtonLabel}
        </Button>
    );
}

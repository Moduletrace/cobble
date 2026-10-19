import { useState, type ReactNode } from "react";
import Span from "@moduletrace/twui/layout/Span";
import { AppData } from "@/src/data/app-data";
import type { BotWithLastMessage } from "@/src/types";
import pickRailBots from "../(utils)/pick-rail-bots";
import AllBotsModal from "./all-bots-modal";
import RailBotEntry from "./rail-bot-entry";
import RailSectionLabel from "./rail-section-label";
import RailSeeAllRow from "./rail-see-all-row";

type Props = {
    title: string;
    /**
     * The worker bots, latest activity first.
     */
    workers: BotWithLastMessage[];
    selected_id?: number;
    /**
     * Set inside a workspace, whose conversations have their own sessions.
     */
    workspace_id?: number | null;
    hrefFor: (bot: BotWithLastMessage) => string;
    /**
     * Shown when there are no bots yet.
     */
    empty: string;
    action?: ReactNode;
};

/**
 * A section of bots in the rail: the latest `AppData.RailRecentBots` to be
 * active (and any that want attention), then "See all bots" for the rest,
 * which lists them all in a modal.
 */
export default function RailBotsSection({ title, workers, selected_id, workspace_id, hrefFor, empty, action }: Props) {
    const [open, setOpen] = useState(false);
    const { shown, hidden } = pickRailBots({ workers, selected_id, limit: AppData.RailRecentBots });

    return (
        <>
            <RailSectionLabel title={title} action={action} />
            {shown.map((bot) => (
                <RailBotEntry
                    key={bot.id}
                    bot={bot}
                    href={hrefFor(bot)}
                    selected={bot.id == selected_id}
                    workspace_id={workspace_id}
                />
            ))}
            {workers.length ? null : (
                <Span className="hidden @rail:block px-3 py-2 text-[13px] leading-[18px] text-ink-secondary">
                    {empty}
                </Span>
            )}
            {hidden.length ? (
                <RailSeeAllRow
                    hidden={hidden}
                    label={`See all ${workers.length} bots`}
                    onOpen={() => setOpen(true)}
                />
            ) : null}
            <AllBotsModal open={open} setOpen={setOpen} title={title} bots={workers} hrefFor={hrefFor} />
        </>
    );
}

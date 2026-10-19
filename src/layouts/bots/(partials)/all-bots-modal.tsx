import { useState } from "react";
import Input from "@moduletrace/twui/form/Input";
import Span from "@moduletrace/twui/layout/Span";
import Stack from "@moduletrace/twui/layout/Stack";
import type { BotWithLastMessage } from "@/src/types";
import AddModalShell from "./add-modal-shell";
import AllBotsRow from "./all-bots-row";

type Props = {
    open: boolean;
    setOpen: (open: boolean) => void;
    title: string;
    bots: BotWithLastMessage[];
    hrefFor: (bot: BotWithLastMessage) => string;
};

/**
 * Every bot (of the crew, or of a workspace), latest activity first, with
 * a search by name or job. A bot opens its conversation.
 */
export default function AllBotsModal({ open, setOpen, title, bots, hrefFor }: Props) {
    const [query, setQuery] = useState("");
    const search = query.trim().toLowerCase();
    const found = search
        ? bots.filter((bot) => `${bot.name} ${bot.role || ""}`.toLowerCase().includes(search))
        : bots;

    return (
        <AddModalShell open={open} setOpen={setOpen} title={title} description={`${bots.length} in all.`}>
            <Input
                id="all-bots-search"
                title="Search bots"
                placeholder="Search by name or job"
                autoComplete="off"
                defaultValue={query}
                onChange={(e) => setQuery(e.target.value)}
                wrapperWrapperProps={{ className: "mt-4" }}
            />
            <Stack className="w-full mt-2 max-h-[60vh] overflow-y-auto gap-0! items-stretch">
                {found.map((bot) => (
                    <AllBotsRow key={bot.id} bot={bot} href={hrefFor(bot)} />
                ))}
                {found.length ? null : (
                    <Span className="px-3 py-6 text-[13px] leading-[18px] text-ink-secondary">
                        No bot matches "{query.trim()}".
                    </Span>
                )}
            </Stack>
        </AddModalShell>
    );
}

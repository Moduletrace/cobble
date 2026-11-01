import Button from "@moduletrace/twui/layout/Button";
import Stack from "@moduletrace/twui/layout/Stack";
import { useContext, useMemo, useState } from "react";
import { AppContext } from "@/src/pages/__root";
import { CrewBotsContext } from "@/src/pages/admin/bots/[bot_id]/(data)/crew-bots-context";
import { FilePlaceContext } from "@/src/pages/admin/bots/[bot_id]/(data)/file-place-context";
import SettingsList from "@/src/pages/admin/settings/(partials)/settings-list";
import type { BotHookEventStatus } from "@/src/dict/bot-hook-dict";
import useHookEvents from "@/src/hooks/use-hook-events";
import HookCallsFilters from "./hook-calls-filters";
import HookEventRow from "./hook-event-row";

type Props = {
    hook_id: number;
    /**
     * Where its runs work, for the files their answers name.
     */
    bot_id: number;
    workspace_id: number | null;
};

/**
 * A hook's thread, its calls newest first, loaded when shown and kept
 * live: searchable by what they sent and what their run answered, a page
 * at a time.
 */
export default function HookCalls({ hook_id, bot_id, workspace_id }: Props) {
    const { pageProps } = useContext(AppContext);
    const [query, set_query] = useState("");
    const [status, set_status] = useState<BotHookEventStatus | "">("");
    const { events, loading, error, more, loadOlder } = useHookEvents({ hook_id, query, status });
    const filtered = Boolean(query || status);
    const place = useMemo(() => ({ bot_id, workspace_id }), [bot_id, workspace_id]);

    return (
        <Stack className="w-full gap-0! items-stretch">
            <HookCallsFilters loading={loading} onSearch={set_query} onStatus={set_status} />
            <SettingsList
                is_empty={!events.length}
                empty={loading ? "Loading calls..." : error || (filtered ? "No calls match." : "No calls yet.")}
            >
                <CrewBotsContext.Provider value={pageProps?.bots || []}>
                    <FilePlaceContext.Provider value={place}>
                        {events.map((event) => (
                            <HookEventRow key={`${event.id}-${event.status}`} event={event} />
                        ))}
                    </FilePlaceContext.Provider>
                </CrewBotsContext.Provider>
            </SettingsList>
            {more && events.length ? (
                <Button
                    title="Load older calls"
                    type="button"
                    variant="ghost"
                    color="gray"
                    size="small"
                    loading={loading}
                    onClick={() => loadOlder().catch(() => {})}
                    className="mt-2 self-center px-2! text-[12px]"
                >
                    Older calls
                </Button>
            ) : null}
        </Stack>
    );
}

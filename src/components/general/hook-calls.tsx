import Button from "@moduletrace/twui/layout/Button";
import Stack from "@moduletrace/twui/layout/Stack";
import { useState } from "react";
import SettingsList from "@/src/pages/admin/settings/(partials)/settings-list";
import type { BotHookEventStatus } from "@/src/dict/bot-hook-dict";
import useHookEvents from "@/src/hooks/use-hook-events";
import HookCallsFilters from "./hook-calls-filters";
import HookEventRow from "./hook-event-row";

type Props = {
    hook_id: number;
};

/**
 * A hook's calls, newest first, loaded when shown: searchable by what
 * they sent and what their run answered, a page at a time.
 */
export default function HookCalls({ hook_id }: Props) {
    const [query, set_query] = useState("");
    const [status, set_status] = useState<BotHookEventStatus | "">("");
    const { events, loading, error, more, loadOlder } = useHookEvents({ hook_id, query, status });
    const filtered = Boolean(query || status);

    return (
        <Stack className="w-full gap-0! items-stretch">
            <HookCallsFilters loading={loading} onSearch={set_query} onStatus={set_status} />
            <SettingsList
                is_empty={!events.length}
                empty={loading ? "Loading calls..." : error || (filtered ? "No calls match." : "No calls yet.")}
            >
                {events.map((event) => (
                    <HookEventRow key={event.id} event={event} />
                ))}
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

import SettingsList from "@/src/pages/admin/settings/(partials)/settings-list";
import useHookEvents from "@/src/hooks/use-hook-events";
import HookEventRow from "./hook-event-row";

type Props = {
    hook_id: number;
};

/**
 * A hook's latest calls, newest first, loaded when shown.
 */
export default function HookCalls({ hook_id }: Props) {
    const { events, loading, error } = useHookEvents({ hook_id });

    return (
        <SettingsList is_empty={!events.length} empty={loading ? "Loading calls..." : error || "No calls yet."}>
            {events.map((event) => (
                <HookEventRow key={event.id} event={event} />
            ))}
        </SettingsList>
    );
}

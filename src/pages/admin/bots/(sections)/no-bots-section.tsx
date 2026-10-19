import EmptyContent from "@moduletrace/twui/elements/EmptyContent";
import SettingsShell from "@/src/pages/admin/settings/(partials)/settings-shell";

/**
 * Shown to a user who reaches no bot yet: an admin assigns them bots or
 * adds them to a workspace.
 */
export default function NoBotsSection() {
    return (
        <SettingsShell title="Bots" description="The bots you chat with.">
            <EmptyContent title="No bots for you yet. Ask an admin to assign you a bot or add you to a workspace." />
        </SettingsShell>
    );
}

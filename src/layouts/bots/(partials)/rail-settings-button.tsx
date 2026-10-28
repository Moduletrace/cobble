import Button from "@moduletrace/twui/layout/Button";
import { Settings } from "lucide-react";
import { SettingsDefaultPath } from "@/src/dict/settings-pages-dict";

/**
 * The settings icon beside the user row: a shortcut to the same place as
 * the popover's Settings item. Hidden when the rail collapses.
 */
export default function RailSettingsButton() {
    return (
        <Button
            href={SettingsDefaultPath}
            title="Settings"
            aria-label="Settings"
            variant="ghost"
            color="text"
            className="hidden @rail:flex shrink-0 p-1.5! rounded-default-sm text-ink-secondary dark:text-ink-secondary hover:text-ink hover:dark:text-ink hover:bg-sunken hover:dark:bg-sunken transition-colors duration-[var(--m-fast)] focus-visible:ring-2 focus-visible:ring-ink"
        >
            <Settings size={18} aria-hidden />
        </Button>
    );
}

import { createContext, useState, type ReactNode } from "react";
import Dropdown from "@moduletrace/twui/elements/Dropdown";
import Button from "@moduletrace/twui/layout/Button";
import { EllipsisVertical } from "lucide-react";

/**
 * Closes the open menu. An item that then asks to confirm, or opens a
 * modal, calls it first so the menu never sits over that.
 */
export const SettingsRowMenuClose = createContext<() => void>(() => {});

type Props = {
    /**
     * What the button is called, for the tooltip and screen readers.
     */
    title: string;
    disabled?: boolean;
    children: ReactNode;
};

/**
 * The three-dot menu on a settings row. One icon stands in for the row's
 * actions, which open as a menu. An item closes it through
 * `SettingsRowMenuClose` before it confirms or opens a modal.
 */
export default function SettingsRowMenu({ title, disabled, children }: Props) {
    const [open, setOpen] = useState(false);

    return (
        <SettingsRowMenuClose.Provider value={() => setOpen(false)}>
            <Dropdown
                position="bottom-right"
                externalOpen={open}
                externalSetOpen={setOpen}
                target={
                    <Button
                        title={title}
                        aria-label={title}
                        aria-haspopup="menu"
                        type="button"
                        variant="ghost"
                        color="text"
                        disabled={disabled}
                        className="shrink-0 p-2! text-ink-secondary dark:text-ink-secondary hover:text-ink hover:dark:text-ink hover:bg-sunken hover:dark:bg-sunken rounded-default transition-colors duration-[var(--m-fast)] focus-visible:ring-2 focus-visible:ring-ink"
                    >
                        <EllipsisVertical size={16} aria-hidden />
                    </Button>
                }
            >
                {children}
            </Dropdown>
        </SettingsRowMenuClose.Provider>
    );
}

import { useState } from "react";
import Button from "@moduletrace/twui/layout/Button";
import type {
    TWUIButtonColorType,
    TWUIButtonSizeType,
    TWUIButtonVariantType,
} from "@moduletrace/twui/layout/Button";
import { AppWindow } from "lucide-react";
import { twMerge } from "tailwind-merge";
import ComputerViewerModal from "./computer-viewer-modal";

type Props = {
    computer_id: number;
    /**
     * The computer's name, for the modal and the button's title.
     */
    name: string;
    /**
     * Words after the icon; without them it's an icon button.
     */
    label?: string;
    title?: string;
    variant?: TWUIButtonVariantType;
    color?: TWUIButtonColorType;
    size?: TWUIButtonSizeType;
    disabled?: boolean;
    className?: string;
};

const IconButtonClasses =
    "shrink-0 p-2! text-ink-secondary dark:text-ink-secondary hover:text-ink hover:dark:text-ink hover:bg-sunken hover:dark:bg-sunken rounded-default transition-colors duration-[var(--m-fast)] focus-visible:ring-2 focus-visible:ring-ink";

/**
 * Opens a computer in the viewer over the page, in its browser, terminal
 * or code editor. Lists use it as an icon button; the computer's own page
 * adds a label.
 */
export default function ComputerOpenButton({
    computer_id,
    name,
    label,
    title,
    variant = "ghost",
    color = "text",
    size,
    disabled,
    className,
}: Props) {
    const [open, setOpen] = useState(false);
    const button_title = title || `Open ${name}`;

    return (
        <>
            <Button
                title={button_title}
                aria-label={label ? undefined : button_title}
                type="button"
                variant={variant}
                color={color}
                size={size}
                disabled={disabled}
                onClick={() => setOpen(true)}
                className={twMerge(label ? "shrink-0 gap-1!" : IconButtonClasses, className)}
            >
                <AppWindow size={16} aria-hidden />
                {label}
            </Button>
            <ComputerViewerModal
                open={open}
                onClose={() => setOpen(false)}
                computer_id={computer_id}
                name={name}
            />
        </>
    );
}

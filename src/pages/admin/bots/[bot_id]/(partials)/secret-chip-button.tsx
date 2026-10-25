import Button from "@moduletrace/twui/layout/Button";
import type { LucideIcon } from "lucide-react";

type Props = {
    title: string;
    icon: LucideIcon;
    onClick: () => void;
};

/**
 * One of a secret chip's icon buttons (Reveal, Copy).
 */
export default function SecretChipButton({ title, icon: Icon, onClick }: Props) {
    return (
        <Button
            type="button"
            variant="ghost"
            color="gray"
            size="smaller"
            title={title}
            aria-label={title}
            className="h-5 w-5 shrink-0 p-0!"
            onClick={onClick}
        >
            <Icon size={13} aria-hidden />
        </Button>
    );
}

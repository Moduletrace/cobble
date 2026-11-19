import { useContext } from "react";
import type { LucideIcon } from "lucide-react";
import HeaderMenuItem from "@/src/pages/admin/bots/[bot_id]/(partials)/header-menu-item";
import { SettingsRowMenuClose } from "./settings-row-menu";

type Props = {
    icon: LucideIcon;
    title: string;
    description?: string;
    disabled?: boolean;
    loading?: boolean;
    onClick: () => void;
};

/**
 * One action in a settings row's three-dot menu. It closes the menu, then
 * runs, so a confirm dialog or a modal is the only thing left open.
 */
export default function SettingsRowMenuItem({ icon, title, description, disabled, loading, onClick }: Props) {
    const close = useContext(SettingsRowMenuClose);

    return (
        <HeaderMenuItem
            icon={icon}
            title={title}
            description={description}
            disabled={disabled}
            loading={loading}
            onClick={() => {
                close();
                onClick();
            }}
        />
    );
}

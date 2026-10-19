import { useContext } from "react";
import Button from "@moduletrace/twui/layout/Button";
import { Plus } from "lucide-react";
import { AddFlowContext } from "../(data)/add-flow-context";

/**
 * The rail header's Add icon: opens the Add modal (a bot, a workspace or a
 * computer).
 */
export default function RailAddButton() {
    const { openAdd } = useContext(AddFlowContext);

    return (
        <Button
            title="Add a bot, workspace or computer"
            aria-label="Add a bot, workspace or computer"
            type="button"
            variant="ghost"
            color="text"
            onClick={openAdd}
            className="hidden lg:flex shrink-0 p-1.5! rounded-default-sm text-ink-secondary dark:text-ink-secondary hover:text-ink hover:dark:text-ink hover:bg-sunken hover:dark:bg-sunken transition-colors duration-[var(--m-fast)] focus-visible:ring-2 focus-visible:ring-ink"
        >
            <Plus size={18} aria-hidden />
        </Button>
    );
}

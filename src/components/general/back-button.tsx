import Button from "@moduletrace/twui/layout/Button";
import { ChevronLeft, type LucideIcon } from "lucide-react";

/**
 * Back Button
 */
export default function BackButton() {
    return (
        <Button
            title="Back Button"
            // variant="ghost"
            color="gray"
            onClick={() => {
                window.history.back();
            }}
            className="p-2! w-9 min-w-9 h-9"
        >
            <ChevronLeft size={20} />
        </Button>
    );
}

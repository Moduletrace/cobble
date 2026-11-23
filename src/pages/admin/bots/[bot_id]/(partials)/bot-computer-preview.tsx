import Button from "@moduletrace/twui/layout/Button";
import Stack from "@moduletrace/twui/layout/Stack";
import { Maximize2 } from "lucide-react";
import ComputerViewFrame from "@/src/components/general/computer-view-frame";

type Props = {
    computer_id: number;
    name: string;
    /**
     * Opens the computer in the viewer, larger.
     */
    onOpen: () => void;
};

/**
 * The bot's computer live and small, in its panel's Tools tab, so the user
 * sees what it is doing without leaving the conversation. The frame takes no
 * pointer events, or the panel could not be scrolled past it; a click opens
 * the viewer instead.
 */
export default function BotComputerPreview({ computer_id, name, onOpen }: Props) {
    return (
        <Stack className="relative w-full h-44 mt-2 overflow-hidden rounded-default border border-solid border-hairline bg-sunken">
            <Stack className="absolute inset-0 pointer-events-none">
                <ComputerViewFrame computer_id={computer_id} name={name} mode="browser" />
            </Stack>
            <Button
                type="button"
                variant="ghost"
                color="text"
                title={`Open ${name} in the viewer`}
                aria-label={`Open ${name} in the viewer`}
                onClick={onOpen}
                className="absolute inset-0 w-full h-full p-0! rounded-none! focus-visible:ring-2 focus-visible:ring-ink"
                buttonContentProps={{ className: "absolute right-2 bottom-2" }}
            >
                <Stack className="p-1.5 rounded-default bg-paper/90 border border-solid border-hairline text-ink-secondary">
                    <Maximize2 size={14} aria-hidden />
                </Stack>
            </Button>
        </Stack>
    );
}
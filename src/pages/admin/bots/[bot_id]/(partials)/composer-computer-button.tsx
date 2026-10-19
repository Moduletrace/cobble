import { useContext } from "react";
import Button from "@moduletrace/twui/layout/Button";
import { Monitor } from "lucide-react";
import { BotComputersContext } from "../(data)/bot-computers-context";
import Span from "@moduletrace/twui/layout/Span";

/**
 * Beside the composer's tools: opens the computer the bot is on in the
 * viewer. Nothing when it has none.
 */
export default function ComposerComputerButton() {
    const { computers, openComputer } = useContext(BotComputersContext);

    const computer = computers[0];

    if (!computer?.id) return null;

    const title = `Open ${computer.name || `computer ${computer.id}`}`;

    return (
        <Button
            title={title}
            aria-label={title}
            type="button"
            variant="ghost"
            color="gray"
            size="small"
            onClick={() =>
                openComputer({ computer_id: computer.id || 0, mode: "browser" })
            }
            className="shrink-0 px-1.5! py-0.5! text-ink-secondary dark:text-ink-secondary hover:text-ink hover:dark:text-ink"
        >
            <Span className="text-[12px] leading-4 text-ink-secondary">
                Computer
            </Span>
            <Monitor size={14} aria-hidden />
        </Button>
    );
}

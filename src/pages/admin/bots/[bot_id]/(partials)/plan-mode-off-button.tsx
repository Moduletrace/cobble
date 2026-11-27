import { useContext } from "react";
import Button from "@moduletrace/twui/layout/Button";
import { CircleOff } from "lucide-react";
import { BotMessageActionsContext } from "../(data)/message-actions-context";

/**
 * Turns Plan mode off for the conversation, offered under a reply that ran
 * in it, so the bot's "turn Plan mode off and I'll do it" is one click: the
 * next message can write and run, and what to send is already in the input
 * (it never sends on its own). Nothing shows once the mode is off.
 */
export default function PlanModeOffButton() {
    const { plan_mode, onTurnOffPlanMode } = useContext(
        BotMessageActionsContext,
    );

    if (!plan_mode) return null;

    return (
        <Button
            type="button"
            size="smaller"
            title="Turn Plan mode off: the next message can write, run and change things"
            beforeIcon={<CircleOff size={14} aria-hidden />}
            onClick={onTurnOffPlanMode}
            variant="outlined"
        >
            Turn Plan mode off
        </Button>
    );
}

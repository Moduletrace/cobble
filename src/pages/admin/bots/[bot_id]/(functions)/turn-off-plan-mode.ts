/**
 * What the input says after the user turns Plan mode off from a reply's
 * button: the bot's own offer ("turn it off and I'll do it") is waiting on
 * one message, so it is written out for them to edit or send.
 */
export const PlanModeOffPrompt = "Plan mode is off, go ahead.";

type Params = {
    /**
     * The conversation's Plan mode, turned off (`usePlanMode`).
     */
    set_plan_mode: (on: boolean) => void;
    /**
     * The composer's input, filled at the cursor (`ComposerHandle.insertText`).
     */
    insert_text: (params: { text: string }) => void;
};

/**
 * Turn Plan mode off for the conversation and put the next message in the
 * input, never sending it: the button under a Plan mode reply is the click
 * the bot asked for, and the user still decides what goes and when.
 */
export default function turnOffPlanMode({ set_plan_mode, insert_text }: Params) {
    set_plan_mode(false);
    insert_text({ text: PlanModeOffPrompt });
}
import { describe, expect, test } from "bun:test";
import { renderToString } from "react-dom/server";
import { BotMessageActionsContext, type BotMessageActions } from "../(data)/message-actions-context";
import PlanModeOffButton from "./plan-mode-off-button";

type RenderProps = {
    plan_mode: boolean;
};

function makeActions({ plan_mode }: RenderProps): BotMessageActions {
    return {
        onReply: () => {},
        onReact: () => {},
        onRetry: () => {},
        onUseSuggestion: () => {},
        plan_mode,
        onTurnOffPlanMode: () => {},
    };
}

function render({ plan_mode }: RenderProps) {
    return renderToString(
        <BotMessageActionsContext.Provider value={makeActions({ plan_mode })}>
            <PlanModeOffButton />
        </BotMessageActionsContext.Provider>,
    );
}

describe("PlanModeOffButton", () => {
    test("offers the way out while the conversation is in Plan mode", () => {
        const html = render({ plan_mode: true });

        expect(html).toContain("Turn Plan mode off");
        expect(html).toContain("the next message can write, run and change things");
    });

    test("shows nothing once the mode is off", () => {
        expect(render({ plan_mode: false })).not.toContain("Turn Plan mode off");
    });
});
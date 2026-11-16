import { useState } from "react";
import { twMerge } from "tailwind-merge";
import Button from "@moduletrace/twui/layout/Button";
import Span from "@moduletrace/twui/layout/Span";
import { ListChecks } from "lucide-react";
import { BotPlanStates, type BotPlanState } from "@/src/dict/bot-plan-dict";
import setBotPlanState from "../(functions)/set-bot-plan-state";
import useBotPlan from "../(hooks)/use-bot-plan";
import botPlanStatusLine from "../(utils)/bot-plan-status-line";
import BotPlanEditModal from "./bot-plan-edit-modal";
import BotPlanStepRow from "./bot-plan-step-row";

type Props = {
    plan_id: number;
};

const stateTitle = ({ status }: { status: BotPlanState }) =>
    BotPlanStates.find((state) => state.value == status)?.title || status;

/**
 * A plan a bot wrote (`botPlanRef`), shown where the bot named it: what it
 * is for, its steps and where they stand, and the moves the user makes on
 * it. While it waits for them it goes nowhere; once approved the bot works
 * it one step per reply, and the card ticks along as each report comes in.
 * Anyone the plan wasn't written for sees its number only.
 *
 * Built from spans, since the ref sits inside a paragraph of the message
 * (a block element there is a nesting error React reports).
 */
export default function BotPlanCard({ plan_id }: Props) {
    const { view, loading, error: read_error, setView } = useBotPlan({ plan_id });
    const [editing, setEditing] = useState(false);
    const [busy, setBusy] = useState<BotPlanState>();
    const [error, setError] = useState<string>();

    if (!view) {
        return (
            <Span className="font-bold">
                {loading ? `plan ${plan_id}` : `plan ${plan_id} (not available${read_error ? `: ${read_error}` : ""})`}
            </Span>
        );
    }

    const move = async ({ status }: { status: BotPlanState }) => {
        if (busy) return;

        setBusy(status);
        setError(undefined);

        const res = await setBotPlanState({
            plan_id: view.id,
            status: status as "active" | "paused" | "cancelled",
        });

        setBusy(undefined);

        if (!res.success || !res.singleRes) {
            setError(res.msg || `Couldn't move the plan.`);
            return;
        }

        setView(res.singleRes);
    };

    const can_change = view.status == "planned" || view.status == "active" || view.status == "paused";

    return (
        <Span className="my-1 flex w-full flex-col overflow-hidden rounded-default border border-solid border-hairline">
            <Span className="flex w-full flex-nowrap items-center gap-2 border-0 border-b border-solid border-hairline bg-surface py-1.5 pr-2 pl-3">
                <ListChecks size={14} aria-hidden className="shrink-0 text-ink-secondary" />
                <Span className="min-w-0 grow truncate text-[13px] leading-5 font-bold text-ink">{view.title}</Span>
                <Span
                    className={twMerge(
                        "shrink-0 rounded-full border border-solid border-hairline px-2 py-0.5 text-[11px] leading-4 font-bold text-ink-secondary",
                        view.status == "active" && "text-ink",
                    )}
                >
                    {stateTitle({ status: view.status })}
                </Span>
            </Span>

            <Span className="flex w-full flex-col gap-2 py-2.5 pr-3 pl-3">
                <Span className="text-[12px] leading-4 text-ink-secondary">{botPlanStatusLine({ view })}</Span>

                {view.goal ? (
                    <Span className="text-[13px] leading-5 text-ink-secondary">{view.goal}</Span>
                ) : null}

                <Span className="flex w-full flex-col gap-1.5 pt-0.5">
                    {view.steps.map((step, index) => (
                        <BotPlanStepRow
                            key={`${index}-${step.text}`}
                            step={step}
                            current={view.status == "active" && index == view.current_step}
                        />
                    ))}
                </Span>

                {can_change ? (
                    <Span className="flex w-full flex-wrap items-center gap-1.5 pt-1">
                        {view.status == "planned" ? (
                            <Button
                                title="Approve and start"
                                type="button"
                                size="smaller"
                                loading={busy == "active"}
                                disabled={Boolean(busy)}
                                onClick={() => void move({ status: "active" })}
                            >
                                Approve and start
                            </Button>
                        ) : null}

                        {view.status == "active" ? (
                            <Button
                                title="Pause the plan"
                                type="button"
                                variant="outlined"
                                color="gray"
                                size="smaller"
                                loading={busy == "paused"}
                                disabled={Boolean(busy)}
                                onClick={() => void move({ status: "paused" })}
                            >
                                Pause
                            </Button>
                        ) : null}

                        {view.status == "paused" ? (
                            <Button
                                title="Pick the plan back up"
                                type="button"
                                size="smaller"
                                loading={busy == "active"}
                                disabled={Boolean(busy)}
                                onClick={() => void move({ status: "active" })}
                            >
                                Pick it back up
                            </Button>
                        ) : null}

                        <Button
                            title="Change the plan's steps"
                            type="button"
                            variant="outlined"
                            color="gray"
                            size="smaller"
                            disabled={Boolean(busy)}
                            onClick={() => setEditing(true)}
                        >
                            Change steps
                        </Button>

                        {view.status == "planned" || view.status == "paused" ? (
                            <Button
                                title="Cancel the plan"
                                type="button"
                                variant="ghost"
                                color="gray"
                                size="smaller"
                                loading={busy == "cancelled"}
                                disabled={Boolean(busy)}
                                onClick={() => void move({ status: "cancelled" })}
                            >
                                Cancel
                            </Button>
                        ) : null}
                    </Span>
                ) : null}

                {error ? <Span className="text-[12px] leading-4 text-ink">{error}</Span> : null}
            </Span>

            {editing ? (
                <BotPlanEditModal
                    view={view}
                    onSaved={(next) => {
                        setEditing(false);
                        setView(next);
                    }}
                    onCancel={() => setEditing(false)}
                />
            ) : null}
        </Span>
    );
}
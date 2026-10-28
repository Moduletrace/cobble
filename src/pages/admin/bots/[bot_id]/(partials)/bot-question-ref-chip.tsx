import { useState } from "react";
import { twMerge } from "tailwind-merge";
import Modal from "@moduletrace/twui/elements/Modal";
import Button from "@moduletrace/twui/layout/Button";
import H2 from "@moduletrace/twui/layout/H2";
import Span from "@moduletrace/twui/layout/Span";
import Stack from "@moduletrace/twui/layout/Stack";
import { MessageCircleQuestion } from "lucide-react";
import useBotQuestion from "../(hooks)/use-bot-question";
import BotQuestionCard from "./bot-question-card";

type Props = {
    question_id: number;
};

const StatusLabels = {
    pending: "waiting for you",
    answered: "answered",
    skipped: "skipped",
} as const;

/**
 * Questions a bot asked before acting (`botQuestionRef`): a chip naming
 * them and where they stand, which opens the card the user answers them
 * in. Anyone they weren't asked of sees their number only.
 */
export default function BotQuestionRefChip({ question_id }: Props) {
    const { view, loading, setView } = useBotQuestion({ question_id });
    const [open, setOpen] = useState(false);

    if (!view) {
        return (
            <Span className="font-bold">
                {loading ? `questions ${question_id}` : `questions ${question_id} (not available)`}
            </Span>
        );
    }

    const count = view.questions.length;
    const name = view.title || (count == 1 ? "1 question" : `${count} questions`);
    const status = StatusLabels[view.status];
    const pending = view.status == "pending";

    return (
        <Modal
            target={
                <Button
                    type="button"
                    variant={pending ? undefined : "outlined"}
                    color={pending ? undefined : "gray"}
                    size="smaller"
                    title={pending ? `Answer ${name}` : `${name}: ${status}`}
                    className={twMerge(
                        "inline-flex h-6 max-w-full gap-1.5! flex-nowrap align-middle px-2! text-[13px] font-bold whitespace-nowrap",
                        !pending && "text-ink",
                        "[&_.twui-button-content-wrapper]:min-w-0",
                    )}
                >
                    <MessageCircleQuestion size={14} aria-hidden className="shrink-0" />
                    <Span className="min-w-0 truncate">{`${name} · ${status}`}</Span>
                </Button>
            }
            targetWrapperProps={{ className: "inline-flex max-w-full align-middle" }}
            open={open}
            setOpen={setOpen}
            className="max-w-xl bg-paper p-6"
        >
            <Stack className="w-full gap-1! items-stretch">
                <H2 className="text-lg! leading-6! tracking-normal! font-bold text-ink">
                    {view.title || `${view.bot_name} asks before going on`}
                </H2>
                <Span className="text-[13px] leading-[18px] text-ink-secondary">
                    {pending
                        ? `${view.bot_name} wants to be sure what you want before it acts. Your answers go to it as your message.`
                        : `What ${view.bot_name} asked before going on.`}
                </Span>
            </Stack>

            <Stack className="mt-2 max-h-[65vh] w-full gap-0! items-stretch overflow-y-auto">
                <BotQuestionCard view={view} onDecided={setView} onDone={() => setOpen(false)} />
            </Stack>
        </Modal>
    );
}

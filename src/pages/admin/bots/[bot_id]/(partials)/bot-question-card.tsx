import { useState } from "react";
import Button from "@moduletrace/twui/layout/Button";
import Row from "@moduletrace/twui/layout/Row";
import Span from "@moduletrace/twui/layout/Span";
import Stack from "@moduletrace/twui/layout/Stack";
import type { BotQuestionView } from "@/src/types";
import checkBotQuestionAnswers from "@/src/utils/check-bot-question-answers";
import decideBotQuestion from "../(functions)/decide-bot-question";
import botQuestionDraftAnswer, {
    type BotQuestionDraft,
} from "../(utils)/bot-question-draft-answer";
import BotQuestionField from "./bot-question-field";

type Props = {
    view: BotQuestionView;
    onDecided: (view: BotQuestionView) => void;
    onDone: () => void;
};

/**
 * The card a user answers a bot's questions in: each question with its
 * options (radios for one pick, checkboxes for several, "Other" to type
 * their own). Sending or skipping tells the bot in chat, as the user's
 * message, in the conversation it asked in (the route posts it, since that
 * may not be the one on screen). Once decided it shows what they answered.
 */
export default function BotQuestionCard({ view, onDecided, onDone }: Props) {
    const [drafts, setDrafts] = useState<BotQuestionDraft[]>(() =>
        view.questions.map(() => ({ choices: [], other_on: false, other: "" })),
    );
    const [busy, setBusy] = useState<"answer" | "skip">();
    const [error, setError] = useState<string>();

    const open = view.status == "pending";

    const setDraft = ({
        index,
        draft,
    }: {
        index: number;
        draft: BotQuestionDraft;
    }) => {
        setError(undefined);
        setDrafts((current) =>
            current.map((item, i) => (i == index ? draft : item)),
        );
    };

    const decide = async (decision: "answer" | "skip") => {
        const answers = drafts.map((draft) =>
            botQuestionDraftAnswer({ draft }),
        );

        if (decision == "answer") {
            try {
                checkBotQuestionAnswers({ questions: view.questions, answers });
            } catch (e: unknown) {
                setError(
                    e instanceof Error ? e.message : `Answer every question.`,
                );
                return;
            }
        }

        setBusy(decision);
        setError(undefined);

        const res = await decideBotQuestion({
            question_id: view.id,
            answers: decision == "answer" ? answers : undefined,
        }).catch(() => null);

        if (!res?.success || !res.singleRes) {
            setBusy(undefined);
            setError(
                res?.msg ||
                    `Couldn't ${decision == "answer" ? "send your answers" : "skip them"}.`,
            );
            return;
        }

        onDecided(res.singleRes);

        setBusy(undefined);
        onDone();
    };

    return (
        <Stack className="w-full gap-0! items-stretch">
            {view.questions.map((item, index) => (
                <BotQuestionField
                    key={index}
                    question_id={view.id}
                    index={index}
                    item={item}
                    draft={drafts[index]!}
                    answer={view.answers?.[index] || null}
                    open={open}
                    onChange={(draft) => setDraft({ index, draft })}
                />
            ))}

            {view.status == "skipped" ? (
                <Span className="mt-4 text-[13px] leading-5 text-ink">
                    Skipped. Nothing was answered.
                </Span>
            ) : null}

            {error ? (
                <Span className="mt-3 text-[13px] leading-5 text-ink">
                    {error}
                </Span>
            ) : null}

            {open ? (
                <Row className="mt-5 w-full gap-2! justify-end">
                    <Button
                        type="button"
                        variant="outlined"
                        color="gray"
                        size="small"
                        title="Skip: the bot is told you didn't answer"
                        loading={busy == "skip"}
                        disabled={Boolean(busy)}
                        onClick={() => decide("skip")}
                    >
                        Skip
                    </Button>
                    <Button
                        type="button"
                        size="small"
                        title="Send your answers"
                        loading={busy == "answer"}
                        disabled={Boolean(busy)}
                        onClick={() => decide("answer")}
                    >
                        Send answers
                    </Button>
                </Row>
            ) : null}
        </Stack>
    );
}

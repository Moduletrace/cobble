import { MessageCircleQuestion } from "lucide-react";
import Span from "@moduletrace/twui/layout/Span";
import useBotQuestion from "../(hooks)/use-bot-question";
import BotQuestionCard from "./bot-question-card";
import RefCardShell from "./ref-card-shell";

type Props = {
    question_id: number;
};

const StatusLabels = {
    pending: "Waiting for you",
    answered: "Answered",
    skipped: "Skipped",
} as const;

/**
 * Questions a bot asked before acting (`botQuestionRef`), shown in the
 * message as the card the user answers them in, like a plan's card, so
 * they need not open anything to see what is being asked. Anyone they
 * weren't asked of sees their number only.
 */
export default function BotQuestionRefCard({ question_id }: Props) {
    const { view, loading, setView } = useBotQuestion({ question_id });

    if (!view) {
        return (
            <Span className="font-bold">
                {loading ? `questions ${question_id}` : `questions ${question_id} (not available)`}
            </Span>
        );
    }

    const count = view.questions.length;
    const pending = view.status == "pending";

    return (
        <RefCardShell
            icon={<MessageCircleQuestion size={14} aria-hidden />}
            title={view.title || (count == 1 ? "1 question" : `${count} questions`)}
            status={StatusLabels[view.status]}
            tone={pending ? "warning" : view.status == "answered" ? "success" : "gray"}
            description={
                pending
                    ? `${view.bot_name} wants to be sure what you want before it acts. Your answers go to it as your message.`
                    : `What ${view.bot_name} asked before going on.`
            }
        >
            <BotQuestionCard view={view} onDecided={setView} onDone={() => {}} />
        </RefCardShell>
    );
}
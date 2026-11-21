import { KeyRound } from "lucide-react";
import Span from "@moduletrace/twui/layout/Span";
import useSecretRequest from "../(hooks)/use-secret-request";
import RefCardShell from "./ref-card-shell";
import SecretRequestCard from "./secret-request-card";

type Props = {
    request_id: number;
};

const StatusLabels = {
    pending: "Waiting for you",
    saved: "Saved",
    declined: "Declined",
} as const;

/**
 * A secret a bot asked for (`secretRequestRef`), shown in the message as
 * the card the user types it into, like a plan's card. It never passes
 * through the bot's model. Anyone it wasn't asked of sees its number only.
 */
export default function SecretRequestRefCard({ request_id }: Props) {
    const { view, loading, setView } = useSecretRequest({ request_id });

    if (!view) {
        return (
            <Span className="font-bold">
                {loading ? `secret request ${request_id}` : `secret request ${request_id} (not available)`}
            </Span>
        );
    }

    const pending = view.status == "pending";

    return (
        <RefCardShell
            icon={<KeyRound size={14} aria-hidden />}
            title={`${view.bot_name} asks for ${view.key}`}
            status={StatusLabels[view.status]}
            tone={pending ? "warning" : view.status == "saved" ? "success" : "gray"}
            description={
                pending
                    ? "Type it here rather than in the chat: what you write in the chat goes to the bot's model provider, this never does."
                    : `${view.bot_name} asked for this key. It never went through the bot's model.`
            }
        >
            <SecretRequestCard view={view} onDecided={setView} onDone={() => {}} />
        </RefCardShell>
    );
}
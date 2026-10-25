import { useContext, useState } from "react";
import Input from "@moduletrace/twui/form/Input";
import Button from "@moduletrace/twui/layout/Button";
import Row from "@moduletrace/twui/layout/Row";
import Span from "@moduletrace/twui/layout/Span";
import Stack from "@moduletrace/twui/layout/Stack";
import { AppContext } from "@/src/pages/__root";
import type { SecretRequestView } from "@/src/types";
import decideSecretRequest from "../(functions)/decide-secret-request";
import sendBotMessage from "../(functions)/send-bot-message";
import secretRequestMessage from "../(utils)/secret-request-message";
import MessageDetailsHeading from "./message-details-heading";

type Props = {
    view: SecretRequestView;
    onDecided: (view: SecretRequestView) => void;
    onDone: () => void;
};

/**
 * The card a user types a secret a bot asked for into. The value goes
 * from here to the app only: it's saved encrypted as their personal secret
 * for the bot, never put in a message, and the bot (and its model
 * provider) only learns its key. Saving or declining tells the bot in chat.
 */
export default function SecretRequestCard({ view, onDecided, onDone }: Props) {
    const { pageProps } = useContext(AppContext);
    const [value, setValue] = useState("");
    const [busy, setBusy] = useState<"save" | "decline">();
    const [error, setError] = useState<string>();

    const open = view.status == "pending";

    const decide = async (decision: "save" | "decline") => {
        if (decision == "save" && !value) {
            setError(`Enter the value first.`);
            return;
        }

        const question =
            decision == "save"
                ? `Save ${view.key} for ${view.bot_name}? Its runs for you get it on their computers; it's never shown to the bot.`
                : `Decline? Nothing will be saved.`;

        if (!window.confirm(question)) return;

        setBusy(decision);
        setError(undefined);

        const res = await decideSecretRequest({
            request_id: view.id,
            value: decision == "save" ? value : undefined,
        }).catch(() => null);

        if (!res?.success || !res.singleRes) {
            setBusy(undefined);
            setError(res?.msg || `Couldn't ${decision} it.`);
            return;
        }

        setValue("");
        onDecided(res.singleRes);

        await sendBotMessage({
            bot_id: Number(pageProps?.bot?.id) || 0,
            workspace_id: pageProps?.workspace?.id || null,
            text: secretRequestMessage({ view: res.singleRes }),
            media_ids: [],
        }).catch(() => null);

        setBusy(undefined);
        onDone();
    };

    return (
        <Stack className="w-full gap-0! items-stretch">
            <MessageDetailsHeading>What it is</MessageDetailsHeading>
            <Span className="text-[13px] leading-5 text-ink break-words">{view.description}</Span>
            <Span className="mt-1 text-[12px] leading-4 text-ink-secondary">{`Saved as ${view.key}, for your runs of ${view.bot_name} only.`}</Span>

            <MessageDetailsHeading>Why (written by the bot)</MessageDetailsHeading>
            <Span className="whitespace-pre-wrap text-[13px] leading-5 text-ink break-words">{view.reason}</Span>

            {open ? (
                <Stack className="mt-5 w-full gap-2! items-stretch">
                    <Input
                        id={`secret-request-${view.id}`}
                        title={view.key}
                        label={view.key}
                        showLabel
                        type="password"
                        autoComplete="off"
                        placeholder="Paste or type it here, not in the chat"
                        info="Encrypted before it's stored. The bot and its model never see it."
                        value={value}
                        onChange={(e) => setValue(e.target.value)}
                    />
                </Stack>
            ) : (
                <Span className="mt-4 text-[13px] leading-5 text-ink">
                    {view.status == "saved" ? `Saved. You can replace or remove it in Settings, under Secrets.` : `Declined. Nothing was saved.`}
                </Span>
            )}

            {error ? <Span className="mt-2 text-[13px] leading-5 text-ink">{error}</Span> : null}

            {open ? (
                <Row className="mt-5 w-full gap-2! justify-end">
                    <Button
                        type="button"
                        variant="outlined"
                        color="gray"
                        size="small"
                        title="Decline: nothing is saved"
                        loading={busy == "decline"}
                        disabled={Boolean(busy)}
                        onClick={() => decide("decline")}
                    >
                        Decline
                    </Button>
                    <Button
                        type="button"
                        size="small"
                        title={`Save ${view.key}`}
                        loading={busy == "save"}
                        disabled={Boolean(busy)}
                        onClick={() => decide("save")}
                    >
                        Save
                    </Button>
                </Row>
            ) : null}
        </Stack>
    );
}

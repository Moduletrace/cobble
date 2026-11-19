import { useState } from "react";
import { twMerge } from "tailwind-merge";
import Button from "@moduletrace/twui/layout/Button";
import H2 from "@moduletrace/twui/layout/H2";
import Span from "@moduletrace/twui/layout/Span";
import Stack from "@moduletrace/twui/layout/Stack";
import { KeyRound } from "lucide-react";
import useSecretRequest from "../(hooks)/use-secret-request";
import SecretRequestCard from "./secret-request-card";
import RefChipModal from "./ref-chip-modal";

type Props = {
    request_id: number;
};

const StatusLabels = {
    pending: "waiting for you",
    saved: "saved",
    declined: "declined",
} as const;

/**
 * A secret a bot asked for (`secretRequestRef`): a chip naming its key and
 * where it stands, which opens the card the user types it into. Anyone it
 * wasn't asked of sees its number only.
 */
export default function SecretRequestRefChip({ request_id }: Props) {
    const { view, loading, setView } = useSecretRequest({ request_id });
    const [open, setOpen] = useState(false);

    if (!view) {
        return (
            <Span className="font-bold">
                {loading ? `secret request ${request_id}` : `secret request ${request_id} (not available)`}
            </Span>
        );
    }

    const status = StatusLabels[view.status];

    return (
        <RefChipModal
            trigger={
                <Button
                    type="button"
                    variant="outlined"
                    color="gray"
                    size="smaller"
                    title={view.status == "pending" ? `Enter ${view.key}` : `${view.key}: ${status}`}
                    onClick={() => setOpen(true)}
                    className={twMerge(
                        "inline-flex h-6 max-w-full gap-1.5! flex-nowrap align-middle px-2! text-[13px] font-bold text-ink whitespace-nowrap",
                        "[&_.twui-button-content-wrapper]:min-w-0",
                    )}
                >
                    <KeyRound size={14} aria-hidden className="shrink-0" />
                    <Span className="min-w-0 truncate">{`${view.key} · ${status}`}</Span>
                </Button>
            }
            open={open}
            onClose={() => setOpen(false)}
            className="max-w-xl bg-paper p-6"
        >
            <Stack className="w-full gap-1! items-stretch">
                <H2 className="text-lg! leading-6! tracking-normal! font-bold text-ink">{`${view.bot_name} asks for ${view.key}`}</H2>
                <Span className="text-[13px] leading-[18px] text-ink-secondary">
                    {`Type it here rather than in the chat: what you write in the chat goes to the bot's model provider, this never does.`}
                </Span>
            </Stack>

            <Stack className="mt-2 max-h-[65vh] w-full gap-0! items-stretch overflow-y-auto">
                <SecretRequestCard view={view} onDecided={setView} onDone={() => setOpen(false)} />
            </Stack>
        </RefChipModal>
    );
}

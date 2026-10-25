import { useState } from "react";
import Row from "@moduletrace/twui/layout/Row";
import Span from "@moduletrace/twui/layout/Span";
import { Check, Copy, Eye, EyeOff, KeyRound } from "lucide-react";
import revealSecret from "@/src/functions/frontend/reveal-secret";
import copyPendingText from "@/src/utils/copy-pending-text";
import useSecretRef from "../(hooks)/use-secret-ref";
import SecretChipButton from "./secret-chip-button";

type Props = {
    env_id: number;
};

/**
 * A secret a bot showed (`secretRef`): its key, masked, with Reveal and
 * Copy for whoever may see it (`canRevealEnv`). The value is fetched only
 * on a click, held only while shown, and never in the page or the thread.
 */
export default function SecretRefChip({ env_id }: Props) {
    const { view, loading } = useSecretRef({ env_id });
    const [value, setValue] = useState<string>();
    const [copied, setCopied] = useState(false);
    const [error, setError] = useState<string>();

    if (!view) {
        return (
            <Span className="font-bold">{loading ? `secret ${env_id}` : `secret ${env_id} (not available)`}</Span>
        );
    }

    const reveal = async () => {
        if (value !== undefined) {
            setValue(undefined);
            return;
        }

        setError(undefined);

        try {
            setValue(await revealSecret({ env_id }));
        } catch (e) {
            setError(e instanceof Error ? e.message : String(e));
        }
    };

    const copy = async () => {
        setError(undefined);

        const ok = await copyPendingText({ text: revealSecret({ env_id }) }).catch((e: Error) => {
            setError(e.message);
            return false;
        });

        if (!ok) return;

        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <Row
            title={view.description || view.key}
            className="inline-flex h-6 max-w-full gap-1! flex-nowrap items-center align-middle rounded-default border border-hairline px-2 text-[13px] text-ink"
        >
            <KeyRound size={14} aria-hidden className="shrink-0" />
            <Span className="font-bold whitespace-nowrap">{view.key}</Span>
            <Span className="font-mono truncate select-all">{value ?? "••••••••"}</Span>
            {view.can_reveal ? (
                <>
                    <SecretChipButton
                        title={value === undefined ? `Reveal ${view.key}` : `Hide ${view.key}`}
                        icon={value === undefined ? Eye : EyeOff}
                        onClick={reveal}
                    />
                    <SecretChipButton title={`Copy ${view.key}`} icon={copied ? Check : Copy} onClick={copy} />
                </>
            ) : null}
            {error ? <Span className="text-[12px] text-ink-secondary whitespace-nowrap">{error}</Span> : null}
        </Row>
    );
}

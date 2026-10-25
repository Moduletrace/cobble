import { useState } from "react";
import Input from "@moduletrace/twui/form/Input";
import Button from "@moduletrace/twui/layout/Button";
import Row from "@moduletrace/twui/layout/Row";
import Span from "@moduletrace/twui/layout/Span";
import Stack from "@moduletrace/twui/layout/Stack";
import { Copy } from "lucide-react";
import { BotHookPath } from "@/src/dict/bot-hook-dict";
import copyText from "@/src/utils/copy-text";

type Props = {
    token: string;
    /**
     * Whether calls must be signed, so the example says so.
     */
    signed?: boolean;
    onDone: () => void;
};

/**
 * A hook's URL, shown once, right after it was made or given a new one:
 * only a hash of its token is kept, so it can't be shown again. With a
 * copy button and an example call.
 */
export default function HookUrlNotice({ token, signed, onDone }: Props) {
    const [copied, setCopied] = useState(false);
    const url = `${window.location.origin}${BotHookPath}/${token}`;
    const example = `curl -X POST '${url}' -H 'Content-Type: application/json' -d '{"event":"test"}'`;

    const copy = async () => {
        setCopied(await copyText({ text: url }));
    };

    return (
        <Stack className="w-full gap-3! items-stretch pt-4">
            <Span className="text-[13px] leading-[18px] text-ink">
                Copy this URL now: it is shown only once. Anyone who has it can start this hook, so keep it secret.
            </Span>
            <Row className="w-full gap-2! flex-nowrap items-end">
                <Input
                    id="hook-url"
                    title="Hook URL"
                    label="URL"
                    showLabel
                    readOnly
                    value={url}
                    onFocus={(e) => e.target.select()}
                    wrapperWrapperProps={{ className: "grow min-w-0" }}
                />
                <Button title="Copy the URL" type="button" variant="outlined" color="gray" onClick={() => copy().catch(() => {})}>
                    <Copy size={16} aria-hidden />
                    {copied ? "Copied" : "Copy"}
                </Button>
            </Row>
            <Span className="text-[12px] leading-4 text-ink-secondary">
                {signed
                    ? `Calls must be signed with the secret (HMAC-SHA256 of the body) in the header you set.`
                    : `Send any body (JSON or text, up to 64 KB) with a POST. For example:`}
            </Span>
            {signed ? null : (
                <Span className="block w-full rounded-default bg-sunken px-3 py-2 font-mono text-[12px] leading-4 text-ink break-all">
                    {example}
                </Span>
            )}
            <Row className="w-full justify-end">
                <Button title="Done" type="button" onClick={onDone}>
                    Done
                </Button>
            </Row>
        </Stack>
    );
}

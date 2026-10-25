import Row from "@moduletrace/twui/layout/Row";
import Span from "@moduletrace/twui/layout/Span";
import Stack from "@moduletrace/twui/layout/Stack";
import { twMerge } from "tailwind-merge";
import type { ExtensionProposalEnv } from "@/src/types";

type Props = {
    /**
     * Passed whole: its `key` field can't be a React prop.
     */
    env: ExtensionProposalEnv;
};

/**
 * One key a proposed server or tool sends: its name, where it goes, and
 * whether it's saved (and where) or still has to be added.
 */
export default function ProposalEnvRow({ env }: Props) {
    const { key: env_key, where, saved_in } = env;
    const saved = saved_in.length > 0;

    return (
        <Row className="w-full py-2 gap-3! flex-nowrap items-center border-0 border-b border-solid border-hairline last:border-b-0">
            <Stack className="grow min-w-0 gap-0! items-start">
                <Span className="font-mono text-[13px] leading-5 font-bold text-ink break-all">{env_key}</Span>
                <Span className="text-[12px] leading-4 text-ink-secondary">{`Sent in the ${where}`}</Span>
            </Stack>
            <Span
                className={twMerge(
                    "shrink-0 rounded-default-xs px-2 py-0.5 text-[12px] leading-4 font-bold",
                    saved ? "bg-sunken text-ink-secondary" : "bg-ink text-on-ink",
                )}
            >
                {saved ? `Saved · ${saved_in.join(", ")}` : "Missing"}
            </Span>
        </Row>
    );
}

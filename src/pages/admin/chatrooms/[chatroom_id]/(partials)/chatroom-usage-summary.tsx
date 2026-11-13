import Row from "@moduletrace/twui/layout/Row";
import Span from "@moduletrace/twui/layout/Span";
import Stack from "@moduletrace/twui/layout/Stack";
import UsageStat from "@/src/components/general/usage-stat";
import type { ChatroomUsage } from "@/src/types";
import costLabel from "@/src/utils/cost-label";
import formatTokens from "@/src/utils/format-tokens";
import ChatroomUsageBotRow from "./chatroom-usage-bot-row";

type Props = {
    usage?: ChatroomUsage | null;
};

/**
 * What everything in a room cost, under the bots in it: the tokens and
 * model calls every bot's work there took (a turn still running included),
 * the price when the providers reported it, the calls that failed, and the
 * same split by bot.
 */
export default function ChatroomUsageSummary({ usage }: Props) {
    const totals = usage?.totals;
    const failed_calls = usage?.failed_calls || 0;
    const by_bot = usage?.by_bot || [];
    const calls = totals?.calls || 0;

    return (
        <Stack className="w-full gap-4! items-stretch py-6 border-0 border-t border-solid border-hairline">
            <Stack className="w-full gap-1! items-stretch">
                <Span className="text-[11px] uppercase tracking-wide text-ink-secondary">What this room spent</Span>
                <Span className="text-[12px] leading-4 text-ink-secondary">
                    Every model call its bots made here, a turn still running included.
                </Span>
            </Stack>
            <Row className="w-full gap-6! items-start flex-wrap">
                <UsageStat
                    label="Tokens"
                    value={formatTokens({ tokens: totals?.total_tokens })}
                    hint={
                        calls
                            ? `${formatTokens({ tokens: totals?.prompt_tokens })} in${cachedShare({ cached: totals?.cached_tokens, prompt: totals?.prompt_tokens })}, ${formatTokens({ tokens: totals?.completion_tokens })} out`
                            : "Nothing spent yet"
                    }
                />
                <UsageStat
                    label="Model calls"
                    value={formatTokens({ tokens: calls })}
                    hint={failed_calls ? `${failed_calls} failed` : calls ? "None failed" : undefined}
                />
                <UsageStat
                    label="Cost"
                    value={costLabel({ cost: totals?.cost })}
                    hint={totals?.cost ? "As the providers reported it" : "Free models, or no price"}
                />
            </Row>
            {by_bot.length ? (
                <Stack className="w-full gap-1.5! items-stretch pt-1">
                    <Span className="text-[11px] uppercase tracking-wide text-ink-secondary">By bot</Span>
                    {by_bot.map((bot) => (
                        <ChatroomUsageBotRow key={bot.bot_id} bot={bot} />
                    ))}
                </Stack>
            ) : null}
        </Stack>
    );
}

/**
 * How much of what was sent the providers served from their cache, when
 * they said: " (40% cached)".
 */
function cachedShare({ cached, prompt }: { cached?: number; prompt?: number }) {
    if (!cached || !prompt) return "";

    return ` (${Math.round((cached / prompt) * 100)}% cached)`;
}
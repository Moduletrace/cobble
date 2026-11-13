import Row from "@moduletrace/twui/layout/Row";
import Span from "@moduletrace/twui/layout/Span";
import type { ChatroomUsageBot } from "@/src/types";
import costLabel from "@/src/utils/cost-label";
import formatTokens from "@/src/utils/format-tokens";

type Props = {
    bot: ChatroomUsageBot;
};

/**
 * One bot's part of what a room spent, under the room's totals: its name,
 * then the tokens, calls and price of every model call it made there. The
 * hover title breaks it down.
 */
export default function ChatroomUsageBotRow({ bot }: Props) {
    const title = [
        `${formatTokens({ tokens: bot.prompt_tokens })} in, ${formatTokens({ tokens: bot.completion_tokens })} out`,
        `${bot.calls} model ${bot.calls == 1 ? "call" : "calls"}`,
        typeof bot.cost == "number" && bot.cost > 0 ? costLabel({ cost: bot.cost }) : "",
    ]
        .filter(Boolean)
        .join(" · ");

    return (
        <Row className="w-full gap-3! flex-nowrap items-baseline justify-between">
            <Span className="min-w-0 truncate text-[12px] leading-4 font-bold text-ink">
                {bot.name || "A removed bot"}
            </Span>
            <Span title={title} className="shrink-0 text-[12px] leading-4 text-ink-secondary tabular-nums">
                {formatTokens({ tokens: bot.total_tokens })} tokens · {formatTokens({ tokens: bot.calls })}{" "}
                {bot.calls == 1 ? "call" : "calls"}
                {typeof bot.cost == "number" && bot.cost > 0 ? ` · ${costLabel({ cost: bot.cost })}` : ""}
            </Span>
        </Row>
    );
}
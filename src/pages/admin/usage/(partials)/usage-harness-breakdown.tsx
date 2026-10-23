import Center from "@moduletrace/twui/layout/Center";
import Row from "@moduletrace/twui/layout/Row";
import Span from "@moduletrace/twui/layout/Span";
import Stack from "@moduletrace/twui/layout/Stack";
import type { UsageOverview } from "@/src/types";
import SettingsGroup from "@/src/pages/admin/settings/(partials)/settings-group";
import sumTokens from "../(functions)/sum-tokens";
import UsageHarnessRow from "./usage-harness-row";

type Props = {
    rows: UsageOverview["by_harness"];
};

/**
 * What each kind of model call spent: a chat turn, reading an image,
 * transcribing, speaking, making a picture, embedding a file. Their totals
 * add up to the period's.
 */
export default function UsageHarnessBreakdown({ rows }: Props) {
    if (!rows.length) {
        return (
            <SettingsGroup title="By kind of call" description="No model calls in this period yet.">
                <Center className="p-8">
                    <Span size="small">Nothing to break down.</Span>
                </Center>
            </SettingsGroup>
        );
    }

    const total_tokens = sumTokens({ rows });

    return (
        <SettingsGroup title="By kind of call" description="Where the period's tokens went.">
            <Stack className="w-full gap-0!">
                <Row className="w-full pb-2 gap-3! items-center border-0 border-b border-solid border-hairline">
                    <Span className="text-[11px] uppercase tracking-wide text-ink-secondary grow">
                        Kind
                    </Span>
                    <Span className="text-[11px] uppercase tracking-wide text-ink-secondary w-10 text-right">
                        Share
                    </Span>
                    <Span className="text-[11px] uppercase tracking-wide text-ink-secondary w-20 text-right">
                        Tokens
                    </Span>
                    <Span className="text-[11px] uppercase tracking-wide text-ink-secondary w-16 text-right">
                        Cost
                    </Span>
                </Row>
                {rows.map((row) => (
                    <UsageHarnessRow row={row} total_tokens={total_tokens} key={row.harness} />
                ))}
            </Stack>
        </SettingsGroup>
    );
}

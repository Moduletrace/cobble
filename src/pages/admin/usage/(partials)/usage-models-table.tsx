import Center from "@moduletrace/twui/layout/Center";
import Row from "@moduletrace/twui/layout/Row";
import Span from "@moduletrace/twui/layout/Span";
import Stack from "@moduletrace/twui/layout/Stack";
import type { UsageOverview } from "@/src/types";
import { twMerge } from "tailwind-merge";
import SettingsGroup from "@/src/pages/admin/settings/(partials)/settings-group";
import { UsageModelColumns } from "../(data)/usage-table-columns";
import UsageModelHeadCell from "./usage-model-head-cell";
import UsageModelRow from "./usage-model-row";

type Props = {
    rows: UsageOverview["models"];
    days: number;
};

/**
 * Every model the period ran, busiest first. A row's price per thousand
 * tokens is what makes one model's cost comparable with another's, and
 * how many calls each took says which one earned it.
 */
export default function UsageModelsTable({ rows, days }: Props) {
    if (!rows.length) {
        return (
            <SettingsGroup title="By model" description="No model calls in this period yet.">
                <Center className="p-8">
                    <Span size="small">Nothing to list.</Span>
                </Center>
            </SettingsGroup>
        );
    }

    return (
        <SettingsGroup
            title="By model"
            description={`The models this install ran in the last ${days} days, busiest first. The price per thousand tokens is read from what the provider reported.`}
        >
            <Stack className="w-full gap-0! overflow-x-auto">
                <Row
                    className={twMerge(
                        UsageModelColumns,
                        "w-full pb-2 gap-3! items-center border-0 border-b border-solid border-hairline",
                    )}
                >
                    <UsageModelHeadCell className="text-left" title="Model" />
                    <UsageModelHeadCell title="Calls" />
                    <UsageModelHeadCell title="In" />
                    <UsageModelHeadCell title="Out" />
                    <UsageModelHeadCell title="Tokens" />
                    <UsageModelHeadCell title="Per 1K" />
                    <UsageModelHeadCell title="Cost" />
                </Row>
                {rows.map((row) => (
                    <UsageModelRow
                        row={row}
                        key={`${row.provider_name}-${row.model_slug}-${row.harness}`}
                    />
                ))}
            </Stack>
        </SettingsGroup>
    );
}

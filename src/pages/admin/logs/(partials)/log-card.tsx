import type { BUN_SQLITE_COBBLE_LOGS } from "@/db/types/db";
import Card from "@moduletrace/twui/elements/Card";
import Tag from "@moduletrace/twui/elements/Tag";
import H3 from "@moduletrace/twui/layout/H3";
import Row from "@moduletrace/twui/layout/Row";
import Stack from "@moduletrace/twui/layout/Stack";
import Span from "@moduletrace/twui/layout/Span";
import Checkbox from "@moduletrace/twui/form/Checkbox";
import LucideIcon from "@moduletrace/twui/elements/lucide-icon";
import dayjs from "dayjs";
import type { TWUIButtonColorType } from "@moduletrace/twui/layout/Button";
import {
    LogCategoryStyles,
    type LogCategoryValue,
} from "../(data)/log-category-styles";
import DeleteLogsButton from "./delete-logs-button";

type Props = {
    log: BUN_SQLITE_COBBLE_LOGS;
    selected?: boolean;
    toggleSelected: (params: { id: number; checked: boolean }) => void;
    afterDelete: (params: { deleted_ids: number[] }) => void;
};

export default function LogCard({
    log,
    selected,
    toggleSelected,
    afterDelete,
}: Props) {
    const log_id = Number(log.id);
    const category_value = (log.category || "system") as LogCategoryValue;
    const category_style: { title: string; color: TWUIButtonColorType } =
        LogCategoryStyles[category_value] || {
            title: log.category || "Unknown",
            color: "gray",
        };
    const date_created = dayjs(Number(log.created_at));

    let metadata_text: string | undefined;
    if (log.metadata) {
        try {
            metadata_text = JSON.stringify(JSON.parse(log.metadata), null, 2);
        } catch {
            metadata_text = log.metadata;
        }
    }

    return (
        <Card>
            <Stack className="w-full items-stretch gap-3">
                <Row className="w-full justify-between items-start md:flex-nowrap">
                    <Row className="gap-3! items-start flex-nowrap">
                        <Checkbox
                            title={`Select Log #${log_id}`}
                            noLabel
                            checked={Boolean(selected)}
                            wrapperClassName="pt-1"
                            clickDispatchHandler={(checked) => {
                                toggleSelected({ id: log_id, checked });
                            }}
                        />
                        <Stack className="gap-2">
                            <H3>{log.title || "Untitled Log"}</H3>
                            <Row className="gap-2! flex-wrap">
                                <Tag color={category_style.color}>
                                    {category_style.title}
                                </Tag>
                                <Tag color="gray">
                                    {date_created.toString()}
                                </Tag>
                                {log.user_id ? (
                                    <Tag color="gray">User #{log.user_id}</Tag>
                                ) : null}
                                {log.ip_address ? (
                                    <Tag color="gray">{log.ip_address}</Tag>
                                ) : null}
                            </Row>
                        </Stack>
                    </Row>
                    <DeleteLogsButton ids={[log_id]} afterDelete={afterDelete}>
                        <LucideIcon name="Trash2" size={16} />
                    </DeleteLogsButton>
                </Row>
                {log.plain_text ? (
                    <Span className="whitespace-pre-wrap">
                        {log.plain_text}
                    </Span>
                ) : null}
                {metadata_text ? (
                    <Span className="whitespace-pre-wrap text-xs text-slate-500 dark:text-slate-400">
                        {metadata_text}
                    </Span>
                ) : null}
            </Stack>
        </Card>
    );
}

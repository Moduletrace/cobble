import type { BUN_SQLITE_COBBLE_LOGS_JOIN } from "@/src/types/sql-joins";
import Modal from "@moduletrace/twui/elements/Modal";
import Paper from "@moduletrace/twui/elements/Paper";
import Tag from "@moduletrace/twui/elements/Tag";
import { Trash2 } from "lucide-react";
import H3 from "@moduletrace/twui/layout/H3";
import Link from "@moduletrace/twui/layout/Link";
import Row from "@moduletrace/twui/layout/Row";
import Span from "@moduletrace/twui/layout/Span";
import Stack from "@moduletrace/twui/layout/Stack";
import dayjs from "dayjs";
import formatLogMetadata from "../(utils)/format-log-metadata";
import getLogCategoryStyle from "../(utils)/get-log-category-style";
import getLogUserName from "../(utils)/get-log-user-name";
import DeleteLogsButton from "./delete-logs-button";
import LogDetailItem, { type LogDetailItemProps } from "./log-detail-item";

type Props = {
    log?: BUN_SQLITE_COBBLE_LOGS_JOIN;
    open: boolean;
    setOpen: React.Dispatch<React.SetStateAction<boolean>>;
    afterDelete: (params: { deleted_ids: number[] }) => void;
};

export default function LogDetailsModal({
    log,
    open,
    setOpen,
    afterDelete,
}: Props) {
    if (!log) return null;

    const log_id = Number(log.id);
    const category_style = getLogCategoryStyle({ log });
    const user_name = getLogUserName({ log });
    const metadata_text = formatLogMetadata({ metadata: log.metadata });

    const details: LogDetailItemProps[] = [
        {
            label: "Time",
            value: dayjs(Number(log.created_at)).format(
                "ddd, MMM D YYYY, HH:mm:ss",
            ),
        },
        {
            label: "User",
            value: log.user_id ? (
                <Link href={`/admin/settings/users/${log.user_id}`}>
                    {user_name || "User"} #{log.user_id}
                </Link>
            ) : (
                "-"
            ),
        },
        { label: "IP Address", value: log.ip_address || "-" },
    ];

    return (
        <Modal open={open} setOpen={setOpen}>
            <Stack className="w-full items-stretch gap-5">
                <Stack className="gap-2 pr-10">
                    <Row className="gap-2!">
                        <Tag
                            color={category_style.color}
                            variant="outlined"
                            className="w-fit"
                        >
                            {category_style.title}
                        </Tag>
                        <Span size="smaller" variant="faded">
                            Log #{log_id}
                        </Span>
                    </Row>
                    <H3>{log.title || "Untitled Log"}</H3>
                </Stack>

                <Stack className="w-full items-stretch gap-0">
                    {details.map((detail) => (
                        <LogDetailItem {...detail} key={detail.label} />
                    ))}
                </Stack>

                {log.plain_text ? (
                    <Stack className="gap-1">
                        <Span size="smaller" variant="faded">
                            Message
                        </Span>
                        <Span size="small" className="whitespace-pre-wrap">
                            {log.plain_text}
                        </Span>
                    </Stack>
                ) : null}

                {metadata_text ? (
                    <Stack className="w-full items-stretch gap-1">
                        <Span size="smaller" variant="faded">
                            Metadata
                        </Span>
                        <Paper className="p-3 bg-slate-50 dark:bg-white/5 max-h-80 overflow-auto">
                            <Span className="font-mono text-xs whitespace-pre-wrap break-all">
                                {metadata_text}
                            </Span>
                        </Paper>
                    </Stack>
                ) : null}

                <Row className="w-full justify-end">
                    <DeleteLogsButton
                        ids={[log_id]}
                        afterDelete={(params) => {
                            setOpen(false);
                            afterDelete(params);
                        }}
                        variant="outlined"
                        size="small"
                    >
                        <Row className="gap-2! flex-nowrap">
                            <Trash2 size={15} />
                            <Span>Delete log</Span>
                        </Row>
                    </DeleteLogsButton>
                </Row>
            </Stack>
        </Modal>
    );
}

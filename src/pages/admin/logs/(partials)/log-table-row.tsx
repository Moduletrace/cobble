import Tag from "@moduletrace/twui/elements/Tag";
import LucideIcon from "@moduletrace/twui/elements/lucide-icon";
import Checkbox from "@moduletrace/twui/form/Checkbox";
import Span from "@moduletrace/twui/layout/Span";
import type { BUN_SQLITE_BSQLITE_LOGS_JOIN } from "@/src/types/sql-joins";
import dayjs from "dayjs";
import getLogCategoryStyle from "../(utils)/get-log-category-style";
import getLogUserName from "../(utils)/get-log-user-name";
import DeleteLogsButton from "./delete-logs-button";

type Props = {
    log: BUN_SQLITE_BSQLITE_LOGS_JOIN;
    selected?: boolean;
    toggleSelected: (params: { id: number; checked: boolean }) => void;
    openLog: (params: { log: BUN_SQLITE_BSQLITE_LOGS_JOIN }) => void;
    afterDelete: (params: { deleted_ids: number[] }) => void;
};

export default function LogTableRow({
    log,
    selected,
    toggleSelected,
    openLog,
    afterDelete,
}: Props) {
    const log_id = Number(log.id);
    const category_style = getLogCategoryStyle({ log });
    const user_name = getLogUserName({ log });

    return (
        <tr
            className="border-t border-slate-200 dark:border-white/10 cursor-pointer hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
            onClick={() => {
                openLog({ log });
            }}
        >
            <td
                className="w-10 pl-4 py-2.5"
                onClick={(e) => {
                    e.stopPropagation();
                }}
            >
                <Checkbox
                    title={`Select Log #${log_id}`}
                    noLabel
                    checked={Boolean(selected)}
                    clickDispatchHandler={(checked) => {
                        toggleSelected({ id: log_id, checked });
                    }}
                />
            </td>
            <td className="px-4 py-2.5 max-w-0 w-full">
                <Span
                    size="small"
                    className="block truncate"
                    title={log.plain_text || log.title}
                >
                    {log.plain_text || log.title || "Untitled Log"}
                </Span>
            </td>
            <td className="px-4 py-2.5">
                <Tag
                    color={category_style.color}
                    variant="outlined"
                    className="w-fit whitespace-nowrap"
                >
                    {category_style.title}
                </Tag>
            </td>
            <td className="hidden md:table-cell px-4 py-2.5 whitespace-nowrap">
                {log.user_id ? (
                    <Span size="small">
                        {user_name || "User"}{" "}
                        <Span variant="faded">#{log.user_id}</Span>
                    </Span>
                ) : (
                    <Span size="small" variant="faded">
                        -
                    </Span>
                )}
            </td>
            <td className="hidden lg:table-cell px-4 py-2.5 whitespace-nowrap">
                <Span size="small" variant="faded" className="font-mono">
                    {log.ip_address || "-"}
                </Span>
            </td>
            <td className="px-4 py-2.5 text-right whitespace-nowrap">
                <Span size="small" variant="faded">
                    {dayjs(Number(log.created_at)).format("MMM D, HH:mm")}
                </Span>
            </td>
            <td
                className="w-12 pr-2 py-1"
                onClick={(e) => {
                    e.stopPropagation();
                }}
            >
                <DeleteLogsButton
                    ids={[log_id]}
                    afterDelete={afterDelete}
                    size="small"
                >
                    <LucideIcon name="Trash2" size={15} />
                </DeleteLogsButton>
            </td>
        </tr>
    );
}

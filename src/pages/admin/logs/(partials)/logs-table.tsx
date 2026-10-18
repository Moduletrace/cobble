import Paper from "@moduletrace/twui/elements/Paper";
import Checkbox from "@moduletrace/twui/form/Checkbox";
import type useLogsListInit from "../(hooks)/use-logs-list-init";
import { LogsTableColumns } from "../(data)/logs-table-columns";
import LogTableRow from "./log-table-row";
import LogsTableHeadCell from "./logs-table-head-cell";

type Props = {
    init: ReturnType<typeof useLogsListInit>;
};

export default function LogsTable({ init }: Props) {
    const { logs, selected_ids, toggleSelected, all_selected, toggleSelectAll, openLog, afterDelete } =
        init;

    return (
        <Paper className="p-0 gap-0 overflow-x-auto">
            <table className="w-full text-sm">
                <thead className="bg-slate-50 dark:bg-white/5">
                    <tr>
                        <th className="w-10 pl-4 py-2.5">
                            <Checkbox
                                title="Select All Logs On This Page"
                                noLabel
                                checked={all_selected}
                                clickDispatchHandler={(checked) => {
                                    toggleSelectAll({ checked });
                                }}
                            />
                        </th>
                        {LogsTableColumns.map((column) => (
                            <LogsTableHeadCell {...column} key={column.title} />
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {(logs || []).map((log) => (
                        <LogTableRow
                            log={log}
                            selected={selected_ids.includes(Number(log.id))}
                            toggleSelected={toggleSelected}
                            openLog={openLog}
                            afterDelete={afterDelete}
                            key={log.id}
                        />
                    ))}
                </tbody>
            </table>
        </Paper>
    );
}

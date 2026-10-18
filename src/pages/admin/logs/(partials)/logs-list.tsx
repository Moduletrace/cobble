import Loading from "@moduletrace/twui/elements/Loading";
import Pagination from "@moduletrace/twui/elements/Pagination";
import Paper from "@moduletrace/twui/elements/Paper";
import Center from "@moduletrace/twui/layout/Center";
import Span from "@moduletrace/twui/layout/Span";
import Stack from "@moduletrace/twui/layout/Stack";
import useLogsListInit from "../(hooks)/use-logs-list-init";
import LogDetailsModal from "./log-details-modal";
import LogsTable from "./logs-table";
import LogsToolbar from "./logs-toolbar";

export default function LogsList() {
    const init = useLogsListInit({});
    const {
        logs,
        count,
        page,
        setPage,
        limit,
        afterDelete,
        active_log,
        log_modal_open,
        setLogModalOpen,
    } = init;

    return (
        <Stack className="w-full items-stretch">
            <LogsToolbar init={init} />
            {!logs ? (
                <Paper>
                    <Center className="p-20">
                        <Loading />
                    </Center>
                </Paper>
            ) : !logs[0] ? (
                <Paper>
                    <Center className="p-20">
                        <Span>No Logs Found!</Span>
                    </Center>
                </Paper>
            ) : (
                <LogsTable init={init} />
            )}
            {count && count > limit ? (
                <Pagination
                    count={count}
                    page={page}
                    setPage={setPage}
                    limit={limit}
                />
            ) : null}
            <LogDetailsModal
                log={active_log}
                open={log_modal_open}
                setOpen={setLogModalOpen}
                afterDelete={afterDelete}
            />
        </Stack>
    );
}

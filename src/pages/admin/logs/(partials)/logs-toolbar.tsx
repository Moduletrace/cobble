import Paper from "@moduletrace/twui/elements/Paper";
import { Trash2 } from "lucide-react";
import Row from "@moduletrace/twui/layout/Row";
import Span from "@moduletrace/twui/layout/Span";
import Stack from "@moduletrace/twui/layout/Stack";
import type useLogsListInit from "../(hooks)/use-logs-list-init";
import DeleteLogsButton from "./delete-logs-button";
import LogCategoryFilter from "./log-category-filter";

type Props = {
    init: ReturnType<typeof useLogsListInit>;
};

export default function LogsToolbar({ init }: Props) {
    const {
        count,
        category,
        selectCategory,
        selected_ids,
        afterDelete,
    } = init;

    return (
        <Paper>
            <Stack className="w-full items-stretch gap-4">
                <LogCategoryFilter
                    category={category}
                    selectCategory={selectCategory}
                />
                <Row className="w-full justify-between">
                    <Span size="small" variant="faded">
                        {typeof count == "number"
                            ? `${count} log${count == 1 ? "" : "s"}`
                            : "--"}
                    </Span>
                    {selected_ids[0] ? (
                        <DeleteLogsButton
                            ids={selected_ids}
                            afterDelete={afterDelete}
                            title="Delete Selected Logs"
                            variant="outlined"
                            size="small"
                        >
                            <Row className="gap-2! flex-nowrap">
                                <Trash2 size={15} />
                                <Span>Delete selected ({selected_ids.length})</Span>
                            </Row>
                        </DeleteLogsButton>
                    ) : null}
                </Row>
            </Stack>
        </Paper>
    );
}

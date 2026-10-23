import Center from "@moduletrace/twui/layout/Center";
import Row from "@moduletrace/twui/layout/Row";
import Span from "@moduletrace/twui/layout/Span";
import Stack from "@moduletrace/twui/layout/Stack";
import { useContext, useState } from "react";
import { AppContext } from "@/src/pages/__root";
import type { DatabaseSearchMode } from "@/src/types";
import databaseHref from "../(functions)/database-href";
import useDatabaseRecords from "../(hooks)/use-database-records";
import DatabaseRecordsPane from "../(partials)/database-records-pane";
import DatabaseTableList from "../(partials)/database-table-list";

/**
 * The database browser's state: which table is open, what is searched in
 * it and which page of its records, kept in the address so a table or a
 * search can be linked to and the browser's own back button walks back
 * through them. The open table's first page comes with the page; anything
 * else loads through the API.
 */
export default function DatabaseBrowser() {
    const { pageProps } = useContext(AppContext);
    const tables = pageProps?.database_tables || [];
    const page_records = pageProps?.database_records;
    const [table, set_table] = useState(page_records?.table.name || tables[0]?.name || "");
    const [search, set_search] = useState("");
    const [mode, set_mode] = useState<DatabaseSearchMode>("every_word");
    const [page, set_page] = useState(1);
    const { records, loading, error } = useDatabaseRecords({
        table,
        search,
        mode,
        page,
        page_records,
    });
    const open = records?.table || tables.find((entry) => entry.name == table) || null;

    const navigate = ({
        next_table,
        next_search,
        next_mode,
        next_page,
    }: {
        next_table: string;
        next_search: string;
        next_mode: DatabaseSearchMode;
        next_page: number;
    }) => {
        set_table(next_table);
        set_search(next_search);
        set_mode(next_mode);
        set_page(next_page);

        const url = new URL(databaseHref({
            table: next_table,
            search: next_search,
            mode: next_mode,
            page: next_page,
        }), window.location.origin);

        history.pushState(null, "", url);
    };

    if (!tables.length) {
        return (
            <Center className="p-16">
                <Span size="small">
                    The database has no tables yet, or they couldn't be read.
                </Span>
            </Center>
        );
    }

    return (
        <Row className="w-full mt-6 gap-6! flex-wrap items-start lg:flex-nowrap">
            <DatabaseTableList
                tables={tables}
                table={table}
                onOpenTable={(next_table) =>
                    navigate({ next_table, next_search: "", next_mode: mode, next_page: 1 })
                }
            />
            {open ? (
                <DatabaseRecordsPane
                    table={open}
                    records={records}
                    search={search}
                    mode={mode}
                    loading={loading}
                    error={error}
                    onSubmitSearch={(next_search) =>
                        navigate({ next_table: table, next_search, next_mode: mode, next_page: 1 })
                    }
                    onChangeMode={(next_mode) =>
                        navigate({ next_table: table, next_search: search, next_mode, next_page: 1 })
                    }
                    onChangePage={(next_page) =>
                        navigate({ next_table: table, next_search: search, next_mode: mode, next_page })
                    }
                />
            ) : (
                <Stack className="grow items-stretch">
                    <Center className="p-16">
                        <Span size="small">Pick a table to read its records.</Span>
                    </Center>
                </Stack>
            )}
        </Row>
    );
}

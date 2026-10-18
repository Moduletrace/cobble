import Loading from "@moduletrace/twui/elements/Loading";
import Select from "@moduletrace/twui/form/Select";
import { useAdminCrudGet } from "@/src/hooks/use-admin-crud-get";
import type { TableType } from "@/src/types";
import Modal from "@moduletrace/twui/elements/Modal";
import Button from "@moduletrace/twui/layout/Button";
import Card from "@moduletrace/twui/elements/Card";
import H3 from "@moduletrace/twui/layout/H3";
import type { BUN_SQLITE_BSQLITE_ALL_TYPEDEFS } from "@/db/types/db";
import useStatus from "@moduletrace/twui/hooks/useStatus";
import H4 from "@moduletrace/twui/layout/H4";
import Stack from "@moduletrace/twui/layout/Stack";
import Span from "@moduletrace/twui/layout/Span";
import Row from "@moduletrace/twui/layout/Row";
import dayjs from "dayjs";
import twuiNumberfy from "@moduletrace/twui/utils/numberfy";
import LucideIcon from "@moduletrace/twui/elements/lucide-icon";
import EmptyContent from "@moduletrace/twui/elements/EmptyContent";

export type CopyableRecord = {
    id?: number | "";
    title?: string;
    subject?: string;
};

type Props<T extends {} = BUN_SQLITE_BSQLITE_ALL_TYPEDEFS> = {
    table: TableType;
    title: string;
    onSelect?: (record: T) => void;
    onClear?: () => void;
};

export default function CopyFromExistingSelect<
    T extends BUN_SQLITE_BSQLITE_ALL_TYPEDEFS =
        BUN_SQLITE_BSQLITE_ALL_TYPEDEFS,
>({ table, title, onSelect, onClear }: Props<T>) {
    const { res: records, ready } = useAdminCrudGet<T>({
        table,
    });

    const { open, setOpen } = useStatus();

    return (
        <Row>
            <Button
                title="Clear Form"
                onClick={(e) => {
                    e.preventDefault();
                    onClear?.();
                }}
                variant="outlined"
                color="gray"
            >
                Clear
            </Button>
            <Modal
                open={open}
                setOpen={setOpen}
                target={
                    <Button
                        title="Duplicate Existing Record"
                        onClick={(e) => {
                            e.preventDefault();
                        }}
                        variant="outlined"
                    >
                        Create from an Existing Record
                    </Button>
                }
                className="xl:p-6"
            >
                <Stack className="gap-6 w-full">
                    <Stack className="gap-1">
                        <H3 className="text-2xl! font-semibold">
                            {title || "Select Record"}
                        </H3>
                        <Span>Select a record to duplicate</Span>
                    </Stack>

                    <Stack className="w-full items-stretch">
                        {records?.[0] ? (
                            records?.map((rec, index) => {
                                const date = dayjs(
                                    twuiNumberfy(rec.created_at),
                                );

                                return (
                                    <Card
                                        key={index}
                                        onClick={() => {
                                            onSelect?.(rec);
                                            setOpen(false);
                                        }}
                                        className="w-full cursor-pointer"
                                    >
                                        <Row className="w-full justify-between">
                                            <Row>
                                                <LucideIcon
                                                    name="Database"
                                                    size={17}
                                                    opacity={0.5}
                                                />
                                                <H4 className="text-base! font-semibold">
                                                    {rec.title}
                                                </H4>
                                            </Row>

                                            <Row>
                                                <Span
                                                    size="smaller"
                                                    variant="faded"
                                                    className="text-nowrap"
                                                >
                                                    {date
                                                        .toString()
                                                        .substring(0, 16)}
                                                </Span>
                                            </Row>
                                        </Row>
                                    </Card>
                                );
                            })
                        ) : (
                            <EmptyContent title="No Records Found!" />
                        )}
                    </Stack>
                </Stack>
            </Modal>
        </Row>
    );
}

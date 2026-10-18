import Row from "@moduletrace/twui/layout/Row";
import _ from "lodash";
import Span from "@moduletrace/twui/layout/Span";
import Card from "@moduletrace/twui/elements/Card";
import type { RefObject } from "react";
import type { BUN_SQLITE_COBBLE_USERS_JOIN } from "@/src/types/sql-joins";

type Props = {
    selected: RefObject<Set<BUN_SQLITE_COBBLE_USERS_JOIN>>;
};

export default function AllPeopleListSelections({ selected }: Props) {
    const total = Array.from(selected.current.entries()).length;

    if (!total) {
        return null;
    }

    return (
        <Card className="py-2! px-3! w-full">
            <Row>
                <Span>
                    {Array.from(selected.current.entries()).length} items
                    selected
                </Span>
            </Row>
        </Card>
    );
}

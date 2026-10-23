import Input from "@moduletrace/twui/form/Input";
import Select from "@moduletrace/twui/form/Select";
import Row from "@moduletrace/twui/layout/Row";
import { useEffect, useState } from "react";
import type { DatabaseSearchMode } from "@/src/types";
import { DatabaseSearchModes } from "../(data)/database-search-modes";

type Props = {
    search: string;
    mode: DatabaseSearchMode;
    loading?: boolean;
    onSubmit: (search: string) => void;
    onChangeMode: (mode: DatabaseSearchMode) => void;
};

/**
 * Narrowing the open table down: a search over every column's text and how
 * it matches. Enter (or the clear button, which runs it empty) is what asks
 * for it, so typing doesn't fire a query a keystroke.
 */
export default function DatabaseSearchFields({ search, mode, loading, onSubmit, onChangeMode }: Props) {
    const [value, set_value] = useState(search);

    // The search the browser is showing can change without this input: the
    // browser's back button, or a link that carries its own.
    useEffect(() => set_value(search), [search]);

    return (
        <Row className="w-full mt-3 gap-2! flex-wrap items-start md:flex-nowrap">
            <Input
                placeholder="Search every column of this table"
                value={value}
                disabled={loading}
                onChange={(event) => set_value(event.target.value)}
                onKeyDown={(event) => {
                    if (event.key == "Enter") onSubmit(event.currentTarget.value);
                }}
                clearInputProps={{
                    onClick: () => {
                        set_value("");
                        onSubmit("");
                    },
                }}
                wrapperWrapperProps={{ className: "w-full grow" }}
            />
            <Select
                title="How the search matches"
                aria-label="How the search matches"
                options={DatabaseSearchModes.map((option) => ({
                    title: option.title,
                    value: option.value,
                    default: option.value == mode,
                }))}
                changeHandler={(next) => onChangeMode(next)}
                wrapperWrapperProps={{ className: "w-[150px] shrink-0" }}
            />
        </Row>
    );
}

import { useState } from "react";
import SearchSelect from "@moduletrace/twui/form/SearchSelect";
import Button from "@moduletrace/twui/layout/Button";
import Row from "@moduletrace/twui/layout/Row";

type Props = {
    id: string;
    /**
     * What's being picked, e.g. "bot".
     */
    noun: string;
    options: { value: string; title: string }[];
    loading?: boolean;
    onAdd: (params: { value: string }) => void;
};

/**
 * A searchable select of things to add, and an Add button beside it, so a
 * long list (many tools, bots or workspaces) is narrowed by typing rather
 * than scrolled.
 */
export default function InlineAddSelect({ id, noun, options, loading, onAdd }: Props) {
    const [value, setValue] = useState("");
    const [reset_key, setResetKey] = useState(0);

    if (!options.length) return null;

    const add = () => {
        if (!value || loading) return;

        onAdd({ value });
        // The given one leaves `options`, and SearchSelect reads its value
        // only on mount, so the field is remounted empty.
        setValue("");
        setResetKey((key) => key + 1);
    };

    return (
        <Row className="w-full gap-2! flex-nowrap items-end">
            <SearchSelect
                key={reset_key}
                id={id}
                title={`Pick a ${noun}`}
                placeholder={`Pick a ${noun}…`}
                options={options}
                changeHandler={(next) => setValue(Array.isArray(next) ? next[0] || "" : next)}
                wrapperWrapperProps={{ className: "grow min-w-0" }}
            />
            <Button
                title={`Add the ${noun}`}
                type="button"
                size="small"
                variant="outlined"
                color="gray"
                loading={loading}
                disabled={!value || loading}
                onClick={add}
                className="shrink-0"
            >
                Add
            </Button>
        </Row>
    );
}
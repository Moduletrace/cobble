import { useState } from "react";
import Select from "@moduletrace/twui/form/Select";
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
 * A select of things to add, and an Add button beside it.
 */
export default function InlineAddSelect({ id, noun, options, loading, onAdd }: Props) {
    const [value, setValue] = useState("");

    if (!options.length) return null;

    return (
        <Row className="w-full gap-2! flex-nowrap items-end">
            <Select
                id={id}
                title={`Pick a ${noun}`}
                aria-label={`Pick a ${noun}`}
                options={[
                    { value: "", title: `Pick a ${noun}…`, default: !value },
                    ...options.map((option) => ({ ...option, default: option.value == value })),
                ]}
                changeHandler={(next) => setValue(String(next))}
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
                onClick={() => value && onAdd({ value })}
                className="shrink-0"
            >
                Add
            </Button>
        </Row>
    );
}

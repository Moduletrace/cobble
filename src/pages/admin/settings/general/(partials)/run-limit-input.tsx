import Input from "@moduletrace/twui/form/Input";

type Props = {
    label: string;
    value: string;
    min?: number;
    max?: number;
    suffix: string;
    info: string;
    onChange: (value: string) => void;
};

/**
 * One number of the run limits form. It only reads `value` when it
 * mounts: the form remounts it (its `key`) after a save or a discard.
 */
export default function RunLimitInput({ label, value, min = 0, max, suffix, info, onChange }: Props) {
    return (
        <Input
            label={label}
            type="number"
            min={min}
            max={max}
            step={1}
            numberText
            rawNumber
            defaultValue={value}
            onChange={(event) => onChange(event.target.value)}
            suffix={suffix}
            info={info}
        />
    );
}

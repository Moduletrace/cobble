import Input from "@moduletrace/twui/form/Input";
import Row from "@moduletrace/twui/layout/Row";
import Span from "@moduletrace/twui/layout/Span";
import Toggle from "@moduletrace/twui/elements/Toggle";

type Props = {
    /**
     * The input's id, which is also the anchor a settings ref points at.
     */
    id?: string;
    label: string;
    value: string;
    /**
     * No limit at all: the field reads "Unlimited" instead of a number, and
     * the save leaves its limit out entirely.
     */
    unlimited: boolean;
    min?: number;
    max?: number;
    suffix: string;
    info: string;
    onChange: (value: string) => void;
    onUnlimitedChange: (unlimited: boolean) => void;
};

/**
 * What a field with no limit says, in place of a number.
 */
const UnlimitedLabel = "Unlimited";

/**
 * One number of the run limits form, with the switch that turns its limit
 * off entirely. It only reads `value` and `unlimited` when it mounts: the
 * form remounts it (its `key`) after a save, a discard or a turn of its
 * switch.
 */
export default function RunLimitInput({
    id,
    label,
    value,
    unlimited,
    min = 0,
    max,
    suffix,
    info,
    onChange,
    onUnlimitedChange,
}: Props) {
    return (
        <Row className="w-full flex-nowrap items-start gap-3">
            <Input
                id={id}
                showLabel
                labelProps={id ? { htmlFor: id } : undefined}
                className="grow scroll-mt-24"
                label={label}
                type={unlimited ? "text" : "number"}
                min={unlimited ? undefined : min}
                max={unlimited ? undefined : max}
                step={unlimited ? undefined : 1}
                numberText={!unlimited}
                rawNumber={!unlimited}
                defaultValue={unlimited ? UnlimitedLabel : value}
                disabled={unlimited}
                variant={unlimited ? "inactive" : undefined}
                onChange={(event) => onChange(event.target.value)}
                suffix={suffix}
                info={info}
            />
            <Row className="shrink-0 items-center gap-2 pt-3">
                <Span className="text-xs whitespace-nowrap text-ink-secondary">No limit</Span>
                <Toggle default_active={unlimited} changeHandler={onUnlimitedChange} />
            </Row>
        </Row>
    );
}
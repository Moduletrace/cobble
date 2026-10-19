import Input from "@moduletrace/twui/form/Input";
import { AppData } from "@/src/data/app-data";

type Props = {
    id: string;
    timeout_ms?: number;
    onChange: (timeout_ms?: number) => void;
};

/**
 * How long a tool may run, in seconds. Empty uses the default.
 */
export default function TimeoutField({ id, timeout_ms, onChange }: Props) {
    return (
        <Input
            id={`${id}-timeout`}
            title="Timeout (seconds)"
            label="Timeout (seconds)"
            showLabel
            type="number"
            min={1}
            max={AppData.CustomToolMaxTimeoutMs / 1000}
            placeholder={String(AppData.CustomToolDefaultTimeoutMs / 1000)}
            defaultValue={timeout_ms ? String(timeout_ms / 1000) : ""}
            onChange={(e) => {
                const seconds = Number(e.target.value);
                onChange(seconds > 0 ? Math.round(seconds * 1000) : undefined);
            }}
        />
    );
}

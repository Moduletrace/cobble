import Button from "@moduletrace/twui/layout/Button";
import Row from "@moduletrace/twui/layout/Row";
import { Pencil, Plus, Trash2 } from "lucide-react";

type Props = {
    name: string;
    /**
     * "set" for an app setting that isn't saved yet.
     */
    mode: "edit" | "set";
    busy?: boolean;
    onEdit: () => void;
    onRemove?: () => void;
};

/**
 * Edit (or Set) and Remove for one env row.
 */
export default function EnvRowActions({ name, mode, busy, onEdit, onRemove }: Props) {
    return (
        <Row className="gap-1! flex-nowrap shrink-0">
            <Button
                title={mode == "set" ? `Set ${name}` : `Edit ${name}`}
                type="button"
                variant="ghost"
                color="gray"
                size="small"
                disabled={busy}
                onClick={onEdit}
            >
                {mode == "set" ? <Plus size={16} aria-hidden /> : <Pencil size={16} aria-hidden />}
            </Button>
            {onRemove ? (
                <Button
                    title={`Remove ${name}`}
                    type="button"
                    variant="ghost"
                    color="gray"
                    size="small"
                    loading={busy}
                    disabled={busy}
                    onClick={onRemove}
                >
                    <Trash2 size={16} aria-hidden />
                </Button>
            ) : null}
        </Row>
    );
}

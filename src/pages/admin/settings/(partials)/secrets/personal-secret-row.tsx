import { useState } from "react";
import Input from "@moduletrace/twui/form/Input";
import Button from "@moduletrace/twui/layout/Button";
import Row from "@moduletrace/twui/layout/Row";
import Span from "@moduletrace/twui/layout/Span";
import Stack from "@moduletrace/twui/layout/Stack";
import { Pencil, Trash2 } from "lucide-react";
import { twMerge } from "tailwind-merge";
import RowIconButton from "@/src/components/general/row-icon-button";
import type { PersonalSecret } from "@/src/types";

type Props = {
    secret: PersonalSecret;
    /**
     * Whose it is, for the super admin's list of everyone's.
     */
    show_user?: boolean;
    busy?: boolean;
    /**
     * Saves a new value; without it the row can only be removed.
     */
    onReplace?: (params: { secret: PersonalSecret; value: string }) => Promise<boolean>;
    onRemove: (params: { secret: PersonalSecret }) => void;
};

/**
 * One personal secret: its key, what it's for, which bot (and whose), and
 * never its value. Replace opens a masked input in place.
 */
export default function PersonalSecretRow({ secret, show_user, busy, onReplace, onRemove }: Props) {
    const [editing, setEditing] = useState(false);
    const [value, setValue] = useState("");

    const save = async () => {
        if (!value || !onReplace) return;

        if (await onReplace({ secret, value })) {
            setValue("");
            setEditing(false);
        }
    };

    return (
        <Stack
            className={twMerge(
                "w-full gap-3! items-stretch py-3 px-4",
                "border-0 border-b border-solid border-hairline last:border-b-0",
            )}
        >
            <Row className="w-full gap-3! flex-nowrap items-start justify-between">
                <Stack className="gap-0.5! min-w-0">
                    <Span className="text-sm font-bold leading-5 text-ink truncate">{secret.key}</Span>
                    {secret.description ? (
                        <Span className="text-[13px] leading-[18px] text-ink-secondary break-words">{secret.description}</Span>
                    ) : null}
                    <Span className="text-[13px] leading-[18px] text-ink-secondary">
                        {`${show_user ? `${secret.user_name}, for ` : "For "}${secret.bot_name}`}
                    </Span>
                </Stack>
                <Row className="gap-1! flex-nowrap shrink-0">
                    {onReplace ? (
                        <RowIconButton
                            icon={Pencil}
                            title={`Replace ${secret.key}`}
                            disabled={busy}
                            onClick={() => setEditing(!editing)}
                        />
                    ) : null}
                    <RowIconButton
                        icon={Trash2}
                        title={`Remove ${secret.key}`}
                        loading={busy}
                        disabled={busy}
                        onClick={() => onRemove({ secret })}
                    />
                </Row>
            </Row>
            {editing ? (
                <Row className="w-full gap-2! flex-nowrap items-end">
                    <Input
                        id={`personal-secret-${secret.id}`}
                        title={`New value for ${secret.key}`}
                        label="New value"
                        showLabel
                        type="password"
                        autoComplete="off"
                        value={value}
                        onChange={(e) => setValue(e.target.value)}
                    />
                    <Button
                        type="button"
                        variant="outlined"
                        color="gray"
                        size="small"
                        title="Cancel"
                        onClick={() => {
                            setValue("");
                            setEditing(false);
                        }}
                    >
                        Cancel
                    </Button>
                    <Button type="button" size="small" title={`Save ${secret.key}`} loading={busy} disabled={busy || !value} onClick={save}>
                        Save
                    </Button>
                </Row>
            ) : null}
        </Stack>
    );
}

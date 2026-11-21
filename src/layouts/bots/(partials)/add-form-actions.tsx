import Button from "@moduletrace/twui/layout/Button";
import Row from "@moduletrace/twui/layout/Row";
import Span from "@moduletrace/twui/layout/Span";
import Stack from "@moduletrace/twui/layout/Stack";
import SettingsStatus from "@/src/pages/admin/settings/(partials)/settings-status";

type Props = {
    submit_label: string;
    loading?: boolean;
    error?: string;
    /**
     * A line above the buttons that isn't an error or a save, e.g. what a
     * pasted export brought along.
     */
    notice?: string;
    /**
     * Left out on a form embedded in a settings page: then there is
     * nothing to cancel into.
     */
    onCancel?: () => void;
    /**
     * An extra button before Cancel, e.g. pasting JSON into an add form.
     */
    action?: { label: string; onClick: () => void };
};

/**
 * The foot of an add form: the error, if any, then Cancel and the submit
 * button.
 */
export default function AddFormActions({ submit_label, loading, error, notice, onCancel, action }: Props) {
    return (
        <Stack className="gap-3! items-stretch">
            {notice ? (
                <Span className="text-[13px] leading-[18px] whitespace-pre-line text-ink-secondary">{notice}</Span>
            ) : null}
            <SettingsStatus status={error ? { error: true, msg: error } : undefined} />
            <Row className="gap-2! flex-nowrap justify-end">
                {action ? (
                    <Button
                        title={action.label}
                        type="button"
                        variant="ghost"
                        color="gray"
                        size="small"
                        disabled={loading}
                        onClick={action.onClick}
                    >
                        {action.label}
                    </Button>
                ) : null}
                {onCancel ? (
                    <Button
                        title="Cancel"
                        type="button"
                        variant="ghost"
                        color="gray"
                        size="small"
                        disabled={loading}
                        onClick={onCancel}
                    >
                        Cancel
                    </Button>
                ) : null}
                <Button title={submit_label} type="submit" size="small" loading={loading} disabled={loading}>
                    {submit_label}
                </Button>
            </Row>
        </Stack>
    );
}
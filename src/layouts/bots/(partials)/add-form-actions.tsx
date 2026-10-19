import Button from "@moduletrace/twui/layout/Button";
import Row from "@moduletrace/twui/layout/Row";
import Stack from "@moduletrace/twui/layout/Stack";
import SettingsStatus from "@/src/pages/admin/settings/(partials)/settings-status";

type Props = {
    submit_label: string;
    loading?: boolean;
    error?: string;
    onCancel: () => void;
};

/**
 * The foot of an add form: the error, if any, then Cancel and the submit
 * button.
 */
export default function AddFormActions({ submit_label, loading, error, onCancel }: Props) {
    return (
        <Stack className="gap-3! items-stretch">
            <SettingsStatus status={error ? { error: true, msg: error } : undefined} />
            <Row className="gap-2! flex-nowrap justify-end">
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
                <Button title={submit_label} type="submit" size="small" loading={loading} disabled={loading}>
                    {submit_label}
                </Button>
            </Row>
        </Stack>
    );
}

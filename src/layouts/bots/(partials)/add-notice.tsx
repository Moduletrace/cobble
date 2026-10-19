import Button from "@moduletrace/twui/layout/Button";
import Row from "@moduletrace/twui/layout/Row";
import Stack from "@moduletrace/twui/layout/Stack";
import SettingsStatus from "@/src/pages/admin/settings/(partials)/settings-status";

type Props = {
    msg: string;
    onDone: () => void;
};

/**
 * What an add form shows once it's done and there is nowhere to go.
 */
export default function AddNotice({ msg, onDone }: Props) {
    return (
        <Stack className="w-full gap-4! items-stretch pt-4">
            <SettingsStatus status={{ success: true, msg }} />
            <Row className="justify-end">
                <Button title="Done" type="button" size="small" onClick={onDone}>
                    Done
                </Button>
            </Row>
        </Stack>
    );
}

import { useState } from "react";
import { ArchiveRestore } from "lucide-react";
import Button from "@moduletrace/twui/layout/Button";
import Stack from "@moduletrace/twui/layout/Stack";
import Span from "@moduletrace/twui/layout/Span";
import Tag from "@moduletrace/twui/elements/Tag";
import useBootstrapRestore from "../(hooks)/use-bootstrap-restore";
import BootstrapRestoreModal from "./bootstrap-restore-modal";

/**
 * The other way through first-run setup: instead of a new super admin,
 * the install takes another one's backup. Shows the restore while it
 * runs, then the page goes to the login.
 */
export default function SignupRestoreOption() {
    const [open, setOpen] = useState(false);
    const { restoring, error, track } = useBootstrapRestore();

    return (
        <Stack className="w-full items-center gap-3!">
            <Span className="text-sm text-ink-secondary">
                Moving from another install?
            </Span>
            <Button
                title="Restore from a backup"
                variant="outlined"
                color="gray"
                beforeIcon={<ArchiveRestore />}
                loading={restoring}
                disabled={restoring}
                onClick={() => {
                    setOpen(true);
                }}
            >
                Restore from a backup
            </Button>
            {restoring ? (
                <Tag color="warning">Restoring, the app restarts soon...</Tag>
            ) : null}
            {error ? <Tag color="error">{error}</Tag> : null}
            <BootstrapRestoreModal
                open={open}
                onClose={() => setOpen(false)}
                onStarted={track}
            />
        </Stack>
    );
}

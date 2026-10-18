import Paper from "@moduletrace/twui/elements/Paper";
import H3 from "@moduletrace/twui/layout/H3";
import Section from "@moduletrace/twui/layout/Section";
import Span from "@moduletrace/twui/layout/Span";
import Stack from "@moduletrace/twui/layout/Stack";
import UploadRestoreForm from "../(partials)/upload-restore-form";

export default function UploadRestoreSection() {
    return (
        <Section className="pb-0!">
            <Paper>
                <Stack className="w-full items-stretch gap-4">
                    <Stack className="gap-1!">
                        <H3>Restore from a file</H3>
                        <Span size="small" variant="faded">
                            Upload a SQLite database file. It is saved to the
                            backups list, then restored.
                        </Span>
                    </Stack>
                    <UploadRestoreForm />
                </Stack>
            </Paper>
        </Section>
    );
}

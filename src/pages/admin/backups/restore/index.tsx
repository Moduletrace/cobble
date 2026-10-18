import Hero from "./(sections)/hero";
import UploadRestoreSection from "./(sections)/upload-restore-section";
import BackupsListSection from "../(sections)/backups-list-section";
import backupsPageMeta from "../(functions)/backups-page-meta";

export default function AdminBackupsRestorePage() {
    return (
        <>
            <Hero />
            <UploadRestoreSection />
            <BackupsListSection mode="restore" />
        </>
    );
}

export const meta = backupsPageMeta({
    label: "Restore Backup",
    description: "Restore the database from a backup",
});

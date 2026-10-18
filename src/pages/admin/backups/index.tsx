import Hero from "./(sections)/hero";
import BackupsListSection from "./(sections)/backups-list-section";
import backupsPageMeta from "./(functions)/backups-page-meta";

export default function AdminBackupsPage() {
    return (
        <>
            <Hero />
            <BackupsListSection mode="view" />
        </>
    );
}

export const meta = backupsPageMeta({
    label: "Backups",
    description: "Create and download database backups",
});

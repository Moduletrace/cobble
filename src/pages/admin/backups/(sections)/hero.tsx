import AdminHero from "@/src/components/general/admin-hero";
import CreateBackupButton from "../(partials)/create-backup-button";

export default function Hero() {
    return (
        <AdminHero
            title="Backups"
            description="Snapshots of the database. Older backups are pruned automatically."
            buttons={<CreateBackupButton />}
        />
    );
}

import AdminHero from "@/src/components/general/admin-hero";
import Button from "@moduletrace/twui/layout/Button";

export default function Hero() {
    return (
        <AdminHero
            title="Create New Email"
            description="Compose an email draft, or start from an existing email or letter"
            buttons={
                <>
                    <Button
                        title="All Emails"
                        href="/admin/emails"
                        variant="outlined"
                    >
                        All Emails
                    </Button>
                </>
            }
        />
    );
}

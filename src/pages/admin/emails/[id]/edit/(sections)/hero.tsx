import AdminHero from "@/src/components/general/admin-hero";
import Button from "@moduletrace/twui/layout/Button";

export default function Hero() {
    return (
        <AdminHero
            title="Edit Email"
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

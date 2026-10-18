import AdminHero from "@/src/components/general/admin-hero";
import Button from "@moduletrace/twui/layout/Button";

export default function Hero() {
    return (
        <AdminHero
            title="Create New Letter"
            description="Start a new letter template, or copy from an existing letter"
            buttons={
                <>
                    <Button title="All Letters" href="/admin/letters">
                        All Letters
                    </Button>
                </>
            }
        />
    );
}
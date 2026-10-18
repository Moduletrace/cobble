import AdminHero from "@/src/components/general/admin-hero";
import Button from "@moduletrace/twui/layout/Button";

export default function Hero() {
    return (
        <AdminHero
            title="Edit Letter"
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
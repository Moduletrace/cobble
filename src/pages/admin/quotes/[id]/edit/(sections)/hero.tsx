import AdminHero from "@/src/components/general/admin-hero";
import Button from "@moduletrace/twui/layout/Button";

export default function Hero() {
    return (
        <AdminHero
            title="Edit Quote"
            buttons={
                <>
                    <Button
                        title="All Quotes"
                        href="/admin/quotes"
                        variant="outlined"
                    >
                        All Quotes
                    </Button>
                </>
            }
        />
    );
}
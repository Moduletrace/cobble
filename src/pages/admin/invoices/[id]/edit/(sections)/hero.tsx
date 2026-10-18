import AdminHero from "@/src/components/general/admin-hero";
import Button from "@moduletrace/twui/layout/Button";

export default function Hero() {
    return (
        <AdminHero
            title="Edit Invoice"
            buttons={
                <>
                    <Button
                        title="All Invoices"
                        href="/admin/invoices"
                        variant="outlined"
                    >
                        All Invoices
                    </Button>
                </>
            }
        />
    );
}

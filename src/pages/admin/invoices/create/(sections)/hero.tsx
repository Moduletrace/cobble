import AdminHero from "@/src/components/general/admin-hero";
import { SiteData } from "@/src/data/site-data";
import Button from "@moduletrace/twui/layout/Button";

export default function Hero() {
    return (
        <AdminHero
            title="Create Invoice"
            description={`Generate a branded ${SiteData["SiteName"]} invoice priced in Naira`}
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

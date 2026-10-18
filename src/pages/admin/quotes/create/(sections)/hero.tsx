import AdminHero from "@/src/components/general/admin-hero";
import { SiteData } from "@/src/data/site-data";
import Button from "@moduletrace/twui/layout/Button";

export default function Hero() {
    return (
        <AdminHero
            title="Create Quote"
            description={`Cost a project and generate a branded ${SiteData["SiteName"]} quotation priced in Naira`}
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
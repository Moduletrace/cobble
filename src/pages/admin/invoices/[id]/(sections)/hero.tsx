import AdminHero from "@/src/components/general/admin-hero";
import Button from "@moduletrace/twui/layout/Button";
import { AppContext } from "@/src/pages/__root";
import isReadOnlyUser from "@/src/utils/rbac/is-read-only-user";
import { useContext } from "react";

export default function Hero() {
    const { pageProps } = useContext(AppContext);

    const is_read_only = isReadOnlyUser({
        user_types: pageProps?.user_types,
    });

    return (
        <AdminHero
            title={`${pageProps?.invoice?.title || "-"}`}
            buttons={
                <>
                    {is_read_only ? null : (
                        <Button
                            title="All Invoices"
                            href={`/admin/invoices/${pageProps?.invoice?.id}/edit`}
                        >
                            Edit Invoice
                        </Button>
                    )}
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

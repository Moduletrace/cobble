import AdminHero from "@/src/components/general/admin-hero";
import Button from "@moduletrace/twui/layout/Button";
import { AppContext } from "@/src/pages/__root";
import isReadOnlyUser from "@/src/utils/rbac/is-read-only-user";
import { useContext } from "react";

export default function Hero() {
    const { pageProps } = useContext(AppContext);
    const is_read_only = isReadOnlyUser({ user_types: pageProps?.user_types });

    return (
        <AdminHero
            title="Emails"
            description="Compose email HTML and send to recipients - with optional letter, invoice and file attachments"
            buttons={
                <>
                    {is_read_only ? null : (
                        <Button
                            title="Create New Email"
                            href="/admin/emails/create"
                        >
                            Create New Email
                        </Button>
                    )}
                    <Button
                        variant="outlined"
                        title="View Email Template"
                        href="/admin/emails/template"
                    >
                        View Email Template
                    </Button>
                </>
            }
        />
    );
}
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

    const edit_url = `/admin/letters/${pageProps?.letter?.id}/edit`;
    const title = `${pageProps?.letter?.title || "Letter"}`;

    return (
        <AdminHero
            title={title}
            buttons={
                <>
                    {is_read_only ? null : (
                        <Button title="Edit Letter" href={edit_url}>
                            Edit Letter
                        </Button>
                    )}
                    <Button
                        title="All Letters"
                        href="/admin/letters"
                        variant="outlined"
                    >
                        All Letters
                    </Button>
                </>
            }
        />
    );
}

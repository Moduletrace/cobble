import { useContext } from "react";
import AdminHero from "@/src/components/general/admin-hero";
import { AppContext } from "@/src/pages/__root";
import type { User } from "@/src/types";

export default function DashboardHero() {
    const { pageProps } = useContext(AppContext);
    const user = pageProps?.user as User | undefined;

    return (
        <AdminHero
            title={user?.first_name ? `Welcome, ${user.first_name}` : "Dashboard"}
            description="An overview of your workspace. Pick up where you left off."
        />
    );
}

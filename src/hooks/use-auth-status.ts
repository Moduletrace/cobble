import { useContext } from "react";
import { AppContext } from "@/src/pages/__root";

export function useAuthStatus() {
    const { pageProps } = useContext(AppContext);
    const user = pageProps?.user;
    const user_types = pageProps?.user_types;

    return {
        is_logged_in: !!user?.logged_in_status,
        user,
        user_types,
    };
}

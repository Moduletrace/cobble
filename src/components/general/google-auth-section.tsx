import { useContext, type ComponentProps } from "react";
import { AppContext } from "@/src/pages/__root";
import GoogleAuthButton from "./google-auth-button";
import AuthDivider from "./auth-divider";

/**
 * Google button plus the "OR" divider. Renders nothing when Google
 * sign-in isn't configured.
 */
export default function GoogleAuthSection(
    props: ComponentProps<typeof GoogleAuthButton>,
) {
    const { pageProps } = useContext(AppContext);

    if (!pageProps?.envs?.GOOGLE_CLIENT_ID) {
        return null;
    }

    return (
        <>
            <GoogleAuthButton {...props} />
            <AuthDivider />
        </>
    );
}

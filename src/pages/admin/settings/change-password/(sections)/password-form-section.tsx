import { useContext } from "react";
import { AppContext } from "@/src/pages/__root";
import PasswordForm from "../(partials)/password-form";

export default function PasswordFormSection() {
    const { pageProps } = useContext(AppContext);

    if (!pageProps?.person) return null;

    return <PasswordForm has_password={Boolean(pageProps.has_password)} />;
}

import { useContext } from "react";
import { AppContext } from "@/src/pages/__root";
import ProfileForm from "../(partials)/profile-form";

export default function ProfileFormSection() {
    const { pageProps } = useContext(AppContext);
    const person = pageProps?.person;

    if (!person) return null;

    return <ProfileForm person={person} />;
}

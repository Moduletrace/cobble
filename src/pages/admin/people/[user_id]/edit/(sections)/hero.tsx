import AdminHero from "@/src/components/general/admin-hero";
import { AppContext } from "@/src/pages/__root";
import { useContext } from "react";

export default function Hero() {
    const { pageProps } = useContext(AppContext);

    const person = pageProps?.person;

    if (!person) return null;

    const person_name = `${person.first_name + (person.last_name ? ` ${person.last_name}` : "")}`;

    return <AdminHero title={`Edit ${person_name} Profile`} />;
}

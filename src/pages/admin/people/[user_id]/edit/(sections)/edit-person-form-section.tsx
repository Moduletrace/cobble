import AdminHero from "@/src/components/general/admin-hero";
import Section from "@moduletrace/twui/layout/Section";
import { AppContext } from "@/src/pages/__root";
import { useContext } from "react";
import UserForm from "../../../create/(partials)/user-form";
import _ from "lodash";
import type { UserFormObject, UserType } from "@/src/types";
import type { BUN_SQLITE_COBBLE_USERS_JOIN } from "@/src/types/sql-joins";

export default function EditPersonFormSection() {
    const { pageProps } = useContext(AppContext);

    const person = pageProps?.person;

    if (!person) return null;

    const person_name = `${person.first_name + (person.last_name ? ` ${person.last_name}` : "")}`;

    return (
        <Section>
            <UserForm
                existing_user={{
                    ...(_.pick<
                        BUN_SQLITE_COBBLE_USERS_JOIN,
                        keyof BUN_SQLITE_COBBLE_USERS_JOIN
                    >(person, [
                        "first_name",
                        "last_name",
                        "email",
                        "username",
                        "bio",
                    ]) as UserFormObject),
                    user_types: person.user_types?.split(",") as
                        | UserType[]
                        | undefined,
                }}
                existing_user_full={person}
            />
        </Section>
    );
}

import Section from "@moduletrace/twui/layout/Section";
import { AppContext } from "@/src/pages/__root";
import { useContext } from "react";
import AccountForm from "../(partials)/account-form";
import _ from "lodash";
import type { UserFormObject } from "@/src/types";
import type { BUN_SQLITE_BSQLITE_USERS_JOIN } from "@/src/types/sql-joins";

export default function AccountFormSection() {
    const { pageProps } = useContext(AppContext);

    const person = pageProps?.person;

    if (!person) return null;

    return (
        <Section>
            <AccountForm
                existing_user={
                    _.pick<
                        BUN_SQLITE_BSQLITE_USERS_JOIN,
                        keyof BUN_SQLITE_BSQLITE_USERS_JOIN
                    >(person, [
                        "first_name",
                        "last_name",
                        "email",
                        "username",
                        "bio",
                    ]) as UserFormObject
                }
                existing_user_full={person}
            />
        </Section>
    );
}
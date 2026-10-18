import AdminHero from "@/src/components/general/admin-hero";
import Tag from "@moduletrace/twui/elements/Tag";
import Button from "@moduletrace/twui/layout/Button";
import Row from "@moduletrace/twui/layout/Row";
import Span from "@moduletrace/twui/layout/Span";
import Stack from "@moduletrace/twui/layout/Stack";
import { AppContext } from "@/src/pages/__root";
import isReadOnlyUser from "@/src/utils/rbac/is-read-only-user";
import { useContext } from "react";

export default function Hero() {
    const { pageProps } = useContext(AppContext);

    const person = pageProps?.person;

    if (!person) return null;

    const is_read_only = isReadOnlyUser({
        user_types: pageProps?.user_types,
    });

    const person_name = `${person.first_name + (person.last_name ? ` ${person.last_name}` : "")}`;

    return (
        <AdminHero
            title={person_name}
            buttons={
                <>
                    {is_read_only ? null : (
                        <Button
                            title={`Edit ${person_name} profile`}
                            href={`/admin/people/${person.id}/edit`}
                        >
                            Edit Person
                        </Button>
                    )}
                </>
            }
            description={
                <Stack className="gap-4">
                    {person.user_types?.[0] ? (
                        <Row className="flex-nowrap">
                            {person.user_types?.split(",").map((ut, i) => (
                                <Tag key={i} color="gray" variant="outlined">
                                    {ut}
                                </Tag>
                            ))}
                        </Row>
                    ) : null}
                    {person.bio ? (
                        <div
                            dangerouslySetInnerHTML={{ __html: person.bio }}
                            className="bio-subtitle"
                        />
                    ) : null}
                </Stack>
            }
        />
    );
}

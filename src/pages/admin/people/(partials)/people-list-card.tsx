import Card from "@moduletrace/twui/elements/Card";
import LucideIcon from "@moduletrace/twui/elements/lucide-icon";
import Tag from "@moduletrace/twui/elements/Tag";
import Button from "@moduletrace/twui/layout/Button";
import H3 from "@moduletrace/twui/layout/H3";
import Img from "@moduletrace/twui/layout/Img";
import Row from "@moduletrace/twui/layout/Row";
import Span from "@moduletrace/twui/layout/Span";
import Stack from "@moduletrace/twui/layout/Stack";
import grabMediaURL from "@/src/functions/backend/media/grab-media-url";
import type { BUN_SQLITE_COBBLE_USERS_JOIN } from "@/src/types/sql-joins";
import { AppContext } from "@/src/pages/__root";
import isReadOnlyUser from "@/src/utils/rbac/is-read-only-user";
import { useContext } from "react";
import dayjs from "dayjs";

type Props = {
    person: BUN_SQLITE_COBBLE_USERS_JOIN;
};

export default function PeopleListCard({ person }: Props) {
    const { pageProps } = useContext(AppContext);
    const is_read_only = isReadOnlyUser({
        user_types: pageProps?.user_types,
    });
    const person_name = `${person.first_name + (person.last_name ? ` ${person.last_name}` : "")}`;
    const person_profile_image = person.profile_media_id
        ? grabMediaURL({
              media: { id: person.profile_media_id },
          })
        : undefined;

    const person_url = `/admin/people/${person.id}`;
    const edit_person_url = `/admin/people/${person.id}/edit`;

    const date_created = dayjs(Number(person.created_at));

    return (
        <Card
            className="cursor-pointer"
            onClick={(e) => {
                const target_el = e.target as HTMLElement;

                if (target_el.closest(".cancel-link")) {
                    return;
                }

                if (e.ctrlKey) {
                    window.open(person_url, "__blank");
                } else {
                    window.location.pathname = person_url;
                }
            }}
        >
            <Row className="w-full justify-between">
                <Row>
                    <Img
                        alt={`${person_name}`}
                        src={
                            person_profile_image?.media_url || "/icons/man.png"
                        }
                        size={60}
                        circle
                    />
                    <Stack className="gap-2">
                        <H3>{person_name}</H3>
                        <Row className="gap-2!">
                            {person.user_types?.split(",").map((ut, i) => (
                                <Tag key={i} color="gray">
                                    {ut}
                                </Tag>
                            ))}
                        </Row>
                        <Row className="gap-2!">
                            <LucideIcon
                                name="Clock"
                                size={14}
                                className="opacity-50"
                            />
                            <Span
                                variant="faded"
                                className="text-xs"
                            >
                                {date_created.toString()}
                            </Span>
                        </Row>
                    </Stack>
                </Row>

                <Row className="cancel-link">
                    {is_read_only ? null : (
                        <Button
                            title="Edit Person"
                            href={edit_person_url}
                            variant="ghost"
                            color="gray"
                        >
                            <LucideIcon name="Edit2" size={18} />
                        </Button>
                    )}
                </Row>
            </Row>
        </Card>
    );
}

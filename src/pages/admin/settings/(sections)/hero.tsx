import AdminHero from "@/src/components/general/admin-hero";
import Tag from "@moduletrace/twui/elements/Tag";
import Row from "@moduletrace/twui/layout/Row";
import Stack from "@moduletrace/twui/layout/Stack";
import { AppContext } from "@/src/pages/__root";
import { useContext } from "react";

type Props = {
    section_title: string;
};

export default function Hero({ section_title }: Props) {
    const { pageProps } = useContext(AppContext);

    const person = pageProps?.person;

    if (!person) return null;

    return (
        <AdminHero
            title={section_title}
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
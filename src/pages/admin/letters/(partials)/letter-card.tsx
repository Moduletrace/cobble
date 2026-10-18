import type { BUN_SQLITE_BSQLITE_LETTERS } from "@/db/types/db";
import Card from "@moduletrace/twui/elements/Card";
import Tag from "@moduletrace/twui/elements/Tag";
import H3 from "@moduletrace/twui/layout/H3";
import Row from "@moduletrace/twui/layout/Row";
import Stack from "@moduletrace/twui/layout/Stack";
import dayjs from "dayjs";
import LetterActions from "./letter-actions";
import Link from "@moduletrace/twui/layout/Link";

type Props = {
    letter: BUN_SQLITE_BSQLITE_LETTERS;
};

export default function LetterCard({ letter }: Props) {
    const date_created = dayjs(Number(letter.created_at));

    const view_url = `/admin/letters/${letter.id}`;
    const edit_url = `/admin/letters/${letter.id}/edit`;

    return (
        <Card>
            <Link href={view_url} className="text-foreground-light! dark:text-foreground-dark!">
                <Row className="w-full justify-between items-start">
                    <Stack className="gap-2">
                        <H3>{letter.title}</H3>
                        <Row className="gap-2!">
                            <Tag color="gray">Letter</Tag>
                            {letter.subject ? (
                                <Tag color="gray">{letter.subject}</Tag>
                            ) : null}
                            {letter.to_name ? (
                                <Tag color="gray">{letter.to_name}</Tag>
                            ) : null}
                            <Tag color="gray">{date_created.toString()}</Tag>
                        </Row>
                    </Stack>
                </Row>
            </Link>

            <LetterActions letter={letter} />
        </Card>
    );
}

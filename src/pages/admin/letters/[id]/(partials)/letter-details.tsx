import type { BUN_SQLITE_BSQLITE_LETTERS } from "@/db/types/db";
import Divider from "@moduletrace/twui/layout/Divider";
import Row from "@moduletrace/twui/layout/Row";
import Span from "@moduletrace/twui/layout/Span";
import Stack from "@moduletrace/twui/layout/Stack";
import dayjs from "dayjs";

type Props = {
    letter: BUN_SQLITE_BSQLITE_LETTERS;
};

export default function LetterDetails({ letter }: Props) {
    const date_created = dayjs(Number(letter.created_at)).toString();

    return (
        <Stack className="w-full gap-4">
            <Stack className="gap-1">
                <Span className="text-sm opacity-60">
                    Created {date_created}
                </Span>
                {letter.subject ? (
                    <Span className="font-semibold text-lg!">
                        {letter.subject}
                    </Span>
                ) : null}
            </Stack>

            <Divider />

            <Row className="w-full grid xl:grid-cols-2 gap-6">
                <Stack className="gap-1">
                    <Span className="text-xs opacity-50">
                        Sender
                    </Span>
                    {letter.from_name ? (
                        <Span className="font-semibold">
                            {letter.from_name}
                        </Span>
                    ) : null}
                    {letter.from_address ? (
                        <Span className="whitespace-pre-line">
                            {letter.from_address}
                        </Span>
                    ) : null}
                </Stack>

                <Stack className="gap-1">
                    <Span className="text-xs opacity-50">
                        Recipient
                    </Span>
                    {letter.to_name ? (
                        <Span className="font-semibold">
                            {letter.to_name}
                        </Span>
                    ) : null}
                    {letter.to_address ? (
                        <Span className="whitespace-pre-line">
                            {letter.to_address}
                        </Span>
                    ) : null}
                </Stack>
            </Row>

            <Divider />

            {letter.salutation ? (
                <Span>{letter.salutation}</Span>
            ) : null}

            <div
                className="w-full text-sm leading-relaxed"
                dangerouslySetInnerHTML={{
                    __html: letter.body_html || "",
                }}
            />

            <Stack className="gap-1 mt-4">
                {letter.closing ? (
                    <Span>{letter.closing}</Span>
                ) : null}
                {letter.signature_name ? (
                    <Span className="font-semibold mt-4">
                        {letter.signature_name}
                    </Span>
                ) : null}
                {letter.signature_title ? (
                    <Span className="opacity-60">
                        {letter.signature_title}
                    </Span>
                ) : null}
            </Stack>
        </Stack>
    );
}
import type { BUN_SQLITE_BSQLITE_LETTERS } from "@/db/types/db";
import LucideIcon from "@moduletrace/twui/elements/lucide-icon";
import Button from "@moduletrace/twui/layout/Button";
import Row from "@moduletrace/twui/layout/Row";
import { AppContext } from "@/src/pages/__root";
import isReadOnlyUser from "@/src/utils/rbac/is-read-only-user";
import { useContext, useState } from "react";
import DownloadLetterModal from "./download-letter-modal";

type Props = {
    letter: BUN_SQLITE_BSQLITE_LETTERS;
    is_view_letter_page?: boolean;
};

export default function LetterActions({ letter, is_view_letter_page }: Props) {
    const { pageProps } = useContext(AppContext);
    const is_read_only = isReadOnlyUser({
        user_types: pageProps?.user_types,
    });
    const [download_open, setDownloadOpen] = useState(false);

    const view_url = `/admin/letters/${letter.id}`;
    const edit_url = `/admin/letters/${letter.id}/edit`;
    const duplicate_url = `/admin/letters/create?from=${letter.id}`;
    const new_email_url = `/admin/emails/create?from_letter=${letter.id}`;

    return (
        <Row className="w-full justify-end gap-2!">
            {is_view_letter_page ? null : (
                <Button
                    title="View Letter"
                    variant="ghost"
                    color="gray"
                    href={view_url}
                >
                    <LucideIcon name="Eye" size={16} />
                </Button>
            )}

            <Button
                title="Download Letter PDF"
                variant="ghost"
                color="gray"
                onClick={() => {
                    setDownloadOpen(true);
                }}
            >
                <LucideIcon name="Download" size={16} />
            </Button>

            {is_read_only ? null : (
                <>
                    <Button
                        title="Create a New Email from this Letter"
                        variant="ghost"
                        color="secondary"
                        href={new_email_url}
                    >
                        <LucideIcon name="MailPlus" size={16} />
                    </Button>

                    <Button
                        title="Create a New Letter from this Record"
                        variant="ghost"
                        color="gray"
                        href={duplicate_url}
                    >
                        <LucideIcon name="Copy" size={16} />
                    </Button>

                    <Button
                        title="Edit Letter"
                        variant="ghost"
                        color="gray"
                        href={edit_url}
                    >
                        <LucideIcon name="Edit2" size={16} />
                    </Button>
                </>
            )}

            <DownloadLetterModal
                letter={letter}
                open={download_open}
                setOpen={setDownloadOpen}
            />
        </Row>
    );
}

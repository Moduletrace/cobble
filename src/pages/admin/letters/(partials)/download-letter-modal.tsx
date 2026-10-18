import dayjs from "dayjs";
import type { BUN_SQLITE_BSQLITE_LETTERS } from "@/db/types/db";
import Modal from "@moduletrace/twui/elements/Modal";
import Tag from "@moduletrace/twui/elements/Tag";
import Input from "@moduletrace/twui/form/Input";
import Textarea from "@moduletrace/twui/form/Textarea";
import Button from "@moduletrace/twui/layout/Button";
import Stack from "@moduletrace/twui/layout/Stack";
import useStatus from "@moduletrace/twui/hooks/useStatus";
import { downloadGeneratedPdf } from "@/src/functions/frontend/document-actions";
import { useState } from "react";

type Props = {
    letter: BUN_SQLITE_BSQLITE_LETTERS;
    open: boolean;
    setOpen: React.Dispatch<React.SetStateAction<boolean>>;
};

export default function DownloadLetterModal({
    letter,
    open,
    setOpen,
}: Props) {
    const { loading, setLoading, status, setStatus } = useStatus();

    const [to_name, setToName] = useState(
        letter.to_name || "",
    );
    const [to_address, setToAddress] = useState(
        letter.to_address || "",
    );
    const [letter_date, setLetterDate] = useState(
        dayjs().format("YYYY-MM-DD"),
    );

    const download_pdf = async () => {
        setStatus(undefined);
        setLoading(true);

        const res = await downloadGeneratedPdf({
            url: "/api/admin/letters/generate-pdf",
            body: {
                letter_id: letter.id,
                to_name,
                to_address,
                letter_date: new Date(letter_date).getTime(),
            },
            fallback_filename: `${letter.title || "letter"}.pdf`,
        });

        if (res.success) {
            setStatus({
                error: false,
                success: true,
                msg: "Letter downloaded",
            });
        } else {
            setStatus({
                error: true,
                msg: res.msg || "Couldn't download letter",
            });
        }

        setLoading(false);
    };

    return (
        <Modal open={open} setOpen={setOpen}>
            <Stack className="w-full gap-4">
                <h3>Download Letter PDF</h3>

                <p className="text-sm opacity-60">
                    {letter.title}
                </p>

                {status?.error && <Tag color="error">{status.msg}</Tag>}
                {status?.success && <Tag color="success">{status.msg}</Tag>}

                <Input
                    title="Recipient Name"
                    defaultValue={to_name}
                    onChange={(e) => {
                        setToName(e.target.value);
                    }}
                    showLabel
                />

                <Textarea
                    title="Recipient Address"
                    defaultValue={to_address}
                    onChange={(e) => {
                        setToAddress(e.target.value);
                    }}
                    showLabel
                    rows={3}
                />

                <Input
                    title="Letter Date"
                    type="date"
                    defaultValue={letter_date}
                    onChange={(e) => {
                        setLetterDate(e.target.value);
                    }}
                    showLabel
                />

                <Button
                    title="Download PDF"
                    loading={loading}
                    onClick={() => {
                        download_pdf();
                    }}
                >
                    Download PDF
                </Button>
            </Stack>
        </Modal>
    );
}
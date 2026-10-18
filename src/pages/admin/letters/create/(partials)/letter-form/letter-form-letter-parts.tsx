import type { BUN_SQLITE_BSQLITE_LETTERS } from "@/db/types/db";
import Input from "@moduletrace/twui/form/Input";
import H3 from "@moduletrace/twui/layout/H3";
import Row from "@moduletrace/twui/layout/Row";
import Stack from "@moduletrace/twui/layout/Stack";
import useFormInit from "@/src/hooks/use-form-init";

export default function LetterFormLetterParts({
    setForm,
    form,
}: ReturnType<typeof useFormInit<BUN_SQLITE_BSQLITE_LETTERS>>) {
    return (
        <Stack className="w-full gap-4">
            <H3 className="!mb-0">Subject &amp; Letter Parts</H3>

            <Input
                title="Subject"
                placeholder="Eg. Notice of Annual General Meeting"
                onChange={(e) => {
                    setForm((prev) => ({
                        ...prev,
                        subject: e.target.value,
                    }));
                }}
                defaultValue={form.subject}
                showLabel
            />

            <Row className="w-full grid xl:grid-cols-2">
                <Input
                    title="Salutation"
                    placeholder="Eg. Dear Sir/Madam,"
                    onChange={(e) => {
                        setForm((prev) => ({
                            ...prev,
                            salutation: e.target.value,
                        }));
                    }}
                    defaultValue={form.salutation || "Dear Sir/Madam"}
                    showLabel
                />

                <Input
                    title="Closing"
                    placeholder="Eg. Yours faithfully,"
                    onChange={(e) => {
                        setForm((prev) => ({
                            ...prev,
                            closing: e.target.value,
                        }));
                    }}
                    defaultValue={form.closing || "Yours faithfully"}
                    showLabel
                />
            </Row>

            <Row className="w-full grid xl:grid-cols-2">
                <Input
                    title="Signature Name"
                    placeholder="Eg. John Doe"
                    onChange={(e) => {
                        setForm((prev) => ({
                            ...prev,
                            signature_name: e.target.value,
                        }));
                    }}
                    defaultValue={form.signature_name}
                    showLabel
                />

                <Input
                    title="Signature Title"
                    placeholder="Eg. Managing Director"
                    onChange={(e) => {
                        setForm((prev) => ({
                            ...prev,
                            signature_title: e.target.value,
                        }));
                    }}
                    defaultValue={form.signature_title}
                    showLabel
                />
            </Row>
        </Stack>
    );
}

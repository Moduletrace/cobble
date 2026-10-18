import dayjs from "dayjs";
import { InvoiceStatuses, type InvoiceStatus } from "@/src/dict/document-dict";
import Input from "@moduletrace/twui/form/Input";
import Select from "@moduletrace/twui/form/Select";
import TinyMCEEditor from "@moduletrace/twui/editors/TinyMCE";
import H3 from "@moduletrace/twui/layout/H3";
import Row from "@moduletrace/twui/layout/Row";
import Stack from "@moduletrace/twui/layout/Stack";
import useFormInit from "@/src/hooks/use-form-init";
import type { InvoiceFormObject } from "../../../(data)/invoice-form-types";

export default function InvoiceFormStatusNotes({
    setForm,
    form,
}: ReturnType<typeof useFormInit<InvoiceFormObject>>) {
    return (
        <Stack className="w-full gap-4">
            <H3 className="!mb-0">Dates, Status &amp; Notes</H3>

            <Row className="w-full grid xl:grid-cols-3">
                <Input
                    title="Issue Date"
                    type="date"
                    defaultValue={
                        form.issue_date
                            ? dayjs(Number(form.issue_date)).format(
                                  "YYYY-MM-DD",
                              )
                            : dayjs().format("YYYY-MM-DD")
                    }
                    onChange={(e) => {
                        setForm((prev) => ({
                            ...prev,
                            issue_date: e.target.value
                                ? new Date(e.target.value).getTime()
                                : "",
                        }));
                    }}
                    showLabel
                />

                <Input
                    title="Due Date"
                    type="date"
                    defaultValue={
                        form.due_date
                            ? dayjs(Number(form.due_date)).format("YYYY-MM-DD")
                            : undefined
                    }
                    onChange={(e) => {
                        setForm((prev) => ({
                            ...prev,
                            due_date: e.target.value
                                ? new Date(e.target.value).getTime()
                                : "",
                        }));
                    }}
                    showLabel
                />

                <Select
                    title="Status"
                    options={InvoiceStatuses.map((invoice_status) => ({
                        title: invoice_status.title,
                        value: invoice_status.value,
                        default:
                            invoice_status.value == (form.status || "draft"),
                    }))}
                    onChange={(e) => {
                        setForm((prev) => ({
                            ...prev,
                            status: e.target.value as InvoiceStatus,
                        }));
                    }}
                    showLabel
                />
            </Row>

            <TinyMCEEditor
                name="Notes"
                defaultValue={form.notes}
                changeHandler={(content) => {
                    setForm((prev) => ({
                        ...prev,
                        notes: content,
                    }));
                }}
                placeholder="Eg. Payment is due within 14 days. Please make all transfers to the company bank account."
                options={{ height: 300 }}
                showLabel
            />
        </Stack>
    );
}

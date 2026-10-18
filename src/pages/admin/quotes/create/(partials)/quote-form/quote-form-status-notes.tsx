import dayjs from "dayjs";
import { QuoteStatuses, type QuoteStatus } from "@/src/dict/document-dict";
import Input from "@moduletrace/twui/form/Input";
import Select from "@moduletrace/twui/form/Select";
import TinyMCEEditor from "@moduletrace/twui/editors/TinyMCE";
import H3 from "@moduletrace/twui/layout/H3";
import Row from "@moduletrace/twui/layout/Row";
import Stack from "@moduletrace/twui/layout/Stack";
import useFormInit from "@/src/hooks/use-form-init";
import type { QuoteFormObject } from "../../../(data)/quote-form-types";

export default function QuoteFormStatusNotes({
    setForm,
    form,
}: ReturnType<typeof useFormInit<QuoteFormObject>>) {
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
                    title="Valid Until"
                    type="date"
                    defaultValue={
                        form.valid_until
                            ? dayjs(Number(form.valid_until)).format(
                                  "YYYY-MM-DD",
                              )
                            : undefined
                    }
                    onChange={(e) => {
                        setForm((prev) => ({
                            ...prev,
                            valid_until: e.target.value
                                ? new Date(e.target.value).getTime()
                                : "",
                        }));
                    }}
                    showLabel
                />

                <Select
                    title="Status"
                    options={QuoteStatuses.map((quote_status) => ({
                        title: quote_status.title,
                        value: quote_status.value,
                        default: quote_status.value == (form.status || "draft"),
                    }))}
                    onChange={(e) => {
                        setForm((prev) => ({
                            ...prev,
                            status: e.target.value as QuoteStatus,
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
                placeholder="Eg. Payment may be split - 30% deposit on acceptance, balance on completion. Quote valid for 14 days."
                options={{ height: 300 }}
                showLabel
            />
        </Stack>
    );
}

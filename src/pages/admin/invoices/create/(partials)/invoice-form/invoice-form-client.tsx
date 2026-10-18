import type { BUN_SQLITE_BSQLITE_INVOICES } from "@/db/types/db";
import { SiteData } from "@/src/data/site-data";
import Input from "@moduletrace/twui/form/Input";
import Textarea from "@moduletrace/twui/form/Textarea";
import H3 from "@moduletrace/twui/layout/H3";
import Row from "@moduletrace/twui/layout/Row";
import Stack from "@moduletrace/twui/layout/Stack";
import useFormInit from "@/src/hooks/use-form-init";
import type { InvoiceFormObject } from "../../../(data)/invoice-form-types";

export default function InvoiceFormClient({
    setForm,
    form,
}: ReturnType<typeof useFormInit<InvoiceFormObject>>) {
    return (
        <Stack className="w-full gap-4">
            <H3 className="!mb-0">Client (Bill To)</H3>

            <Row className="w-full grid xl:grid-cols-2">
                <Input
                    title="Client Name"
                    placeholder="Eg. Resident One"
                    onChange={(e) => {
                        setForm((prev) => ({
                            ...prev,
                            client_name: e.target.value,
                        }));
                    }}
                    defaultValue={form.client_name}
                    showLabel
                    required
                />

                <Input
                    title="Client Email"
                    type="email"
                    placeholder="Eg. resident@example.com"
                    onChange={(e) => {
                        setForm((prev) => ({
                            ...prev,
                            client_email: e.target.value,
                        }));
                    }}
                    defaultValue={form.client_email}
                    showLabel
                />
            </Row>

            <Textarea
                title="Client Address"
                placeholder={`Eg. Block A, Flat 1\n${SiteData["SiteName"]} Estate\nSagamu, Lagos State`}
                onChange={(e) => {
                    setForm((prev) => ({
                        ...prev,
                        client_address: e.target.value,
                    }));
                }}
                defaultValue={form.client_address}
                showLabel
                rows={3}
            />
        </Stack>
    );
}
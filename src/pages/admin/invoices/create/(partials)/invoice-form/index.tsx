import type { BUN_SQLITE_BSQLITE_INVOICES } from "@/db/types/db";
import Form from "@moduletrace/twui/form/Form";
import LoadingOverlay from "@moduletrace/twui/elements/LoadingOverlay";
import Tag from "@moduletrace/twui/elements/Tag";
import useFormInit from "@/src/hooks/use-form-init";
import submitInvoiceForm from "../../(functions)/submit-invoice-form";
import type {
    InvoiceFormObject,
    InvoiceItemFormObject,
} from "../../../(data)/invoice-form-types";
import InvoiceFormAction from "./invoice-form-action";
import InvoiceFormClient from "./invoice-form-client";
import InvoiceFormItems from "./invoice-form-items";
import InvoiceFormStatusNotes from "./invoice-form-status-notes";
import InvoiceFormTitle from "./invoice-form-title";
import InvoiceFormShortDescription from "./invoice-form-short-description";
import InvoiceFormQuoteLink from "./invoice-form-quote-link";
import type { QuoteLinkFormObject } from "../../../(data)/invoice-form-types";

type Props = {
    existing_invoice?: BUN_SQLITE_BSQLITE_INVOICES;
    existing_items?: InvoiceItemFormObject[];
    existing_quote_link?: QuoteLinkFormObject;
};

export default function InvoiceForm({
    existing_invoice,
    existing_items,
    existing_quote_link,
}: Props) {
    const initial_form: InvoiceFormObject = {
        ...(existing_invoice as InvoiceFormObject | undefined),
        items: existing_items || undefined,
        quote_link: existing_quote_link,
    };

    const init = useFormInit<InvoiceFormObject>({
        existing: initial_form,
        existing_full: existing_invoice as
            | BUN_SQLITE_BSQLITE_INVOICES
            | undefined,
        title: "Invoice",
    });

    const { loading, status } = init;

    return (
        <>
            <Form
                className="w-full gap-8"
                onSubmit={() => {
                    submitInvoiceForm(init);
                }}
            >
                {status?.error && <Tag color="error">{status.msg}</Tag>}
                {loading && <LoadingOverlay />}

                <InvoiceFormTitle {...init} />
                <InvoiceFormShortDescription {...init} />
                <InvoiceFormClient {...init} />
                <InvoiceFormItems {...init} />
                <InvoiceFormQuoteLink {...init} />
                <InvoiceFormStatusNotes {...init} />
                <InvoiceFormAction {...init} />
            </Form>
        </>
    );
}

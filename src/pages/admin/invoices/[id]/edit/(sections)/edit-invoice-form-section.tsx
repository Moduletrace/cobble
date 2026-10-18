import Section from "@moduletrace/twui/layout/Section";
import { makeRowKey } from "@/src/components/general/sortable-line-items-editor";
import { AppContext } from "@/src/pages/__root";
import { useContext } from "react";
import { koboToNairaString } from "@/src/utils/money";
import InvoiceForm from "../../../create/(partials)/invoice-form";
import type {
    InvoiceItemFormObject,
    QuoteLinkFormObject,
} from "../../../(data)/invoice-form-types";

export default function EditInvoiceFormSection() {
    const { pageProps } = useContext(AppContext);

    const invoice = pageProps?.invoice;
    const invoice_items = pageProps?.invoice_items;
    const quote_links = pageProps?.invoice_quote_links;

    if (!invoice) return null;

    const existing_items: InvoiceItemFormObject[] = (
        invoice_items || []
    ).map((item) => ({
        description: item.description,
        quantity: String(item.quantity || "1"),
        unit_price: koboToNairaString(item.unit_price_kobo),
        _key: makeRowKey(),
    }));

    const first_quote_link = quote_links?.[0];

    const existing_quote_link: QuoteLinkFormObject | undefined =
        first_quote_link
            ? {
                  quote_id: first_quote_link.quote_id || "",
                  amount: koboToNairaString(first_quote_link.amount_kobo),
              }
            : undefined;

    return (
        <Section>
            <InvoiceForm
                existing_invoice={invoice}
                existing_items={existing_items}
                existing_quote_link={existing_quote_link}
            />
        </Section>
    );
}
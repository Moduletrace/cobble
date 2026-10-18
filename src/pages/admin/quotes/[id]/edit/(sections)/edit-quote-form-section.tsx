import Section from "@moduletrace/twui/layout/Section";
import { makeRowKey } from "@/src/components/general/sortable-line-items-editor";
import { AppContext } from "@/src/pages/__root";
import { useContext } from "react";
import { koboToNairaString } from "@/src/utils/money";
import QuoteForm from "../../../create/(partials)/quote-form";
import type { QuoteItemFormObject } from "../../../(data)/quote-form-types";

export default function EditQuoteFormSection() {
    const { pageProps } = useContext(AppContext);

    const quote = pageProps?.quote;
    const quote_items = pageProps?.quote_items;

    if (!quote) return null;

    const existing_items: QuoteItemFormObject[] = (
        quote_items || []
    ).map((item) => ({
        description: item.description,
        quantity: String(item.quantity || "1"),
        unit_price: koboToNairaString(item.unit_price_kobo),
        _key: makeRowKey(),
    }));

    return (
        <Section>
            <QuoteForm
                existing_quote={quote}
                existing_items={existing_items}
            />
        </Section>
    );
}
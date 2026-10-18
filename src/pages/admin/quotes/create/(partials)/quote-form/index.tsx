import type { BUN_SQLITE_BSQLITE_QUOTES } from "@/db/types/db";
import Form from "@moduletrace/twui/form/Form";
import LoadingOverlay from "@moduletrace/twui/elements/LoadingOverlay";
import Tag from "@moduletrace/twui/elements/Tag";
import useFormInit from "@/src/hooks/use-form-init";
import submitQuoteForm from "../../(functions)/submit-quote-form";
import type {
    QuoteFormObject,
    QuoteItemFormObject,
} from "../../../(data)/quote-form-types";
import QuoteFormAction from "./quote-form-action";
import QuoteFormClient from "./quote-form-client";
import QuoteFormItems from "./quote-form-items";
import QuoteFormStatusNotes from "./quote-form-status-notes";
import QuoteFormTitle from "./quote-form-title";
import QuoteFormShortDescription from "./quote-form-short-description";

type Props = {
    existing_quote?: BUN_SQLITE_BSQLITE_QUOTES;
    existing_items?: QuoteItemFormObject[];
};

export default function QuoteForm({
    existing_quote,
    existing_items,
}: Props) {
    const initial_form: QuoteFormObject = {
        ...(existing_quote as QuoteFormObject | undefined),
        items: existing_items || undefined,
    };

    const init = useFormInit<QuoteFormObject>({
        existing: initial_form,
        existing_full: existing_quote as
            | BUN_SQLITE_BSQLITE_QUOTES
            | undefined,
        title: "Quote",
    });

    const { loading, status } = init;

    return (
        <>
            <Form
                className="w-full gap-6"
                onSubmit={() => {
                    submitQuoteForm(init);
                }}
            >
                {status?.error && <Tag color="error">{status.msg}</Tag>}
                {loading && <LoadingOverlay />}

                <QuoteFormTitle {...init} />
                <QuoteFormShortDescription {...init} />
                <QuoteFormClient {...init} />
                <QuoteFormItems {...init} />
                <QuoteFormStatusNotes {...init} />
                <QuoteFormAction {...init} />
            </Form>
        </>
    );
}
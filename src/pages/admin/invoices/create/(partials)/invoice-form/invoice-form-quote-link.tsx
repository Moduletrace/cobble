import type { BUN_SQLITE_BSQLITE_QUOTES } from "@/db/types/db";
import LucideIcon from "@moduletrace/twui/elements/lucide-icon";
import Input from "@moduletrace/twui/form/Input";
import Select from "@moduletrace/twui/form/Select";
import Button from "@moduletrace/twui/layout/Button";
import H3 from "@moduletrace/twui/layout/H3";
import Row from "@moduletrace/twui/layout/Row";
import Span from "@moduletrace/twui/layout/Span";
import Stack from "@moduletrace/twui/layout/Stack";
import twuiNumberfy from "@moduletrace/twui/utils/numberfy";
import { useAdminCrudGet } from "@/src/hooks/use-admin-crud-get";
import useFormInit from "@/src/hooks/use-form-init";
import type {
    InvoiceFormObject,
    QuoteLinkFormObject,
} from "../../../(data)/invoice-form-types";
import LoadingRectangleBlock from "@moduletrace/twui/layout/LoadingRectangleBlock";

export default function InvoiceFormQuoteLink({
    setForm,
    form,
}: ReturnType<typeof useFormInit<InvoiceFormObject>>) {
    const {
        res: quotes,
        ready,
        setReady,
    } = useAdminCrudGet<BUN_SQLITE_BSQLITE_QUOTES>({
        table: "quotes",
    });

    const quote_link: QuoteLinkFormObject = form.quote_link || {
        quote_id: "",
        amount: "",
    };

    const setQuoteLink = (next: QuoteLinkFormObject) => {
        setForm((prev) => ({
            ...prev,
            quote_link: next,
        }));
    };

    const quote_options = [
        {
            title: "- No linked quote -",
            value: "",
            default: !quote_link.quote_id,
        },
        ...(quotes || []).map((quote) => ({
            title: quote.quote_number || quote.title || `#${quote.id}`,
            value: `${quote.id}`,
            default: quote_link.quote_id == quote.id,
        })),
    ];

    return (
        <Stack className="w-full gap-4">
            <H3 className="!mb-0">Linked Quote</H3>

            <Span className="text-sm opacity-60">
                Optionally link this invoice to a quote - e.g. a deposit or
                milestone invoice covering part of a quotation.
            </Span>

            {ready ? (
                <Row className="w-full grid xl:grid-cols-2 items-stretch">
                    <Select
                        key={1}
                        title="Quote"
                        options={quote_options}
                        showLabel
                        changeHandler={(value) => {
                            if (!value) {
                                setQuoteLink({ quote_id: "", amount: "" });
                                return;
                            }

                            setReady(false);

                            setQuoteLink({
                                quote_id: Number(value),
                                amount: quote_link.amount,
                            });

                            setTimeout(() => {
                                setReady(true);
                            }, 200);
                        }}
                    />

                    <Input
                        title="Portion (₦)"
                        type="number"
                        step="0.01"
                        min={0}
                        placeholder="Eg. 150000"
                        defaultValue={Number(quote_link.amount)}
                        onChange={(e) => {
                            setQuoteLink({
                                quote_id: quote_link.quote_id,
                                amount: Math.round(
                                    twuiNumberfy(e.target.value),
                                ).toString(),
                            });
                        }}
                        showLabel
                    />
                </Row>
            ) : (
                <LoadingRectangleBlock className="w-full h-12" />
            )}

            {quote_link.quote_id ? (
                <Button
                    title="Unlink Quote"
                    variant="ghost"
                    color="error"
                    size="smaller"
                    onClick={(e) => {
                        e.preventDefault();
                        setReady(false);
                        setQuoteLink({ quote_id: "", amount: "" });
                        setTimeout(() => {
                            setReady(true);
                        }, 200);
                    }}
                >
                    <LucideIcon name="Trash2" size={14} />
                    Unlink Quote
                </Button>
            ) : null}
        </Stack>
    );
}

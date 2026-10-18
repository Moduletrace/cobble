import type {
    BUN_SQLITE_BSQLITE_QUOTE_ITEMS,
    BUN_SQLITE_BSQLITE_QUOTES,
} from "@/db/types/db";
import adminCrudHandler from "@/src/functions/frontend/admin-crud-handler";
import type useFormInit from "@/src/hooks/use-form-init";
import { nairaToKobo } from "@/src/utils/money";
import type { QuoteFormObject } from "../../(data)/quote-form-types";

export default async function submitQuoteForm({
    setLoading,
    setStatus,
    form,
    existing_full,
    clearLocalForm,
}: ReturnType<typeof useFormInit<QuoteFormObject>>) {
    try {
        if (!form.client_name?.trim()) {
            throw new Error(`Please provide a client name`);
        }

        const items = (form.items || []).filter((item) => {
            return (
                item.description?.trim() ||
                Number(item.quantity) ||
                Number(item.unit_price)
            );
        });

        if (!items.length) {
            throw new Error(`Add at least one line item`);
        }

        const confirm_msg = existing_full?.id
            ? `Update this quote?`
            : `Create new quote?`;

        if (!window.confirm(confirm_msg)) {
            return;
        }

        const quote_row: BUN_SQLITE_BSQLITE_QUOTES = {
            client_name: form.client_name,
            client_email: form.client_email,
            client_address: form.client_address,
            notes: form.notes,
            issue_date: form.issue_date || Date.now(),
            valid_until: form.valid_until,
            status: form.status || "draft",
            title: form.title,
            short_description: form.short_description,
        };

        setLoading(true);

        const create_or_update_res = await adminCrudHandler({
            action: existing_full?.id ? "update" : "insert",
            table: "quotes",
            insert_data: [quote_row],
            update_data: quote_row,
            id: existing_full?.id,
        });

        if (!create_or_update_res.success) {
            throw new Error(create_or_update_res.msg || "Quote Save Failed");
        }

        const quote_id =
            existing_full?.id || create_or_update_res.singleRes?.id;

        if (!quote_id) {
            throw new Error(`Quote ID not found`);
        }

        if (existing_full?.id) {
            const delete_items_res = await adminCrudHandler({
                action: "delete",
                table: "quote_items",
                sql_query: {
                    query: {
                        quote_id: {
                            value: quote_id,
                        },
                    },
                },
            });

            if (!delete_items_res.success) {
                throw new Error(`Couldn't update line items`);
            }
        }

        const new_items: BUN_SQLITE_BSQLITE_QUOTE_ITEMS[] =
            items.map((item, index) => ({
                quote_id,
                description: item.description,
                quantity: Number(item.quantity) || 1,
                unit_price_kobo: nairaToKobo(item.unit_price),
                sort_order: index,
            }));

        const add_items_res = await adminCrudHandler({
            action: "insert",
            table: "quote_items",
            insert_data: new_items,
        });

        if (!add_items_res.success) {
            throw new Error(add_items_res.msg || "Couldn't save line items");
        }

        clearLocalForm();

        if (existing_full?.id) {
            window.location.reload();
        } else {
            window.location.pathname = "/admin/quotes";
        }
    } catch (error: any) {
        setStatus({
            error: true,
            msg: error.message || "Quote Form Error",
        });

        setLoading(false);
    }
}
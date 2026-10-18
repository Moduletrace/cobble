import type {
    BUN_SQLITE_BSQLITE_INVOICE_ITEMS,
    BUN_SQLITE_BSQLITE_INVOICES,
    BUN_SQLITE_BSQLITE_INVOICE_QUOTES,
} from "@/db/types/db";
import adminCrudHandler from "@/src/functions/frontend/admin-crud-handler";
import type useFormInit from "@/src/hooks/use-form-init";
import { nairaToKobo } from "@/src/utils/money";
import type { InvoiceFormObject } from "../../(data)/invoice-form-types";

export default async function submitInvoiceForm({
    setLoading,
    setStatus,
    form,
    existing_full,
    clearLocalForm,
}: ReturnType<typeof useFormInit<InvoiceFormObject>>) {
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
            ? `Update this invoice?`
            : `Create new invoice?`;

        if (!window.confirm(confirm_msg)) {
            return;
        }

        const invoice_row: BUN_SQLITE_BSQLITE_INVOICES = {
            client_name: form.client_name,
            client_email: form.client_email,
            client_address: form.client_address,
            notes: form.notes,
            issue_date: form.issue_date || Date.now(),
            due_date: form.due_date,
            status: form.status || "draft",
            title: form.title,
            short_description: form.short_description,
        };

        setLoading(true);

        const create_or_update_res = await adminCrudHandler({
            action: existing_full?.id ? "update" : "insert",
            table: "invoices",
            insert_data: [invoice_row],
            update_data: invoice_row,
            id: existing_full?.id,
        });

        if (!create_or_update_res.success) {
            throw new Error(create_or_update_res.msg || "Invoice Save Failed");
        }

        const invoice_id =
            existing_full?.id || create_or_update_res.singleRes?.id;

        if (!invoice_id) {
            throw new Error(`Invoice ID not found`);
        }

        if (existing_full?.id) {
            const delete_items_res = await adminCrudHandler({
                action: "delete",
                table: "invoice_items",
                sql_query: {
                    query: {
                        invoice_id: {
                            value: invoice_id,
                        },
                    },
                },
            });

            if (!delete_items_res.success) {
                throw new Error(`Couldn't update line items`);
            }
        }

        const new_items: BUN_SQLITE_BSQLITE_INVOICE_ITEMS[] =
            items.map((item, index) => ({
                invoice_id,
                description: item.description,
                quantity: Number(item.quantity) || 1,
                unit_price_kobo: nairaToKobo(item.unit_price),
                sort_order: index,
            }));

        const add_items_res = await adminCrudHandler({
            action: "insert",
            table: "invoice_items",
            insert_data: new_items,
        });

        if (!add_items_res.success) {
            throw new Error(add_items_res.msg || "Couldn't save line items");
        }

        const delete_quote_link_res = await adminCrudHandler({
            action: "delete",
            table: "invoice_quotes",
            sql_query: {
                query: {
                    invoice_id: {
                        value: invoice_id,
                    },
                },
            },
        });

        // if (!delete_quote_link_res.success) {
        //     throw new Error(`Couldn't update quote link`);
        // }

        if (form.quote_link?.quote_id) {
            const quote_link_row: BUN_SQLITE_BSQLITE_INVOICE_QUOTES = {
                invoice_id,
                quote_id: Number(form.quote_link.quote_id),
                amount_kobo: nairaToKobo(form.quote_link.amount),
            };

            const add_quote_link_res = await adminCrudHandler({
                action: "insert",
                table: "invoice_quotes",
                insert_data: [quote_link_row],
            });

            if (!add_quote_link_res.success) {
                throw new Error(
                    add_quote_link_res.msg || "Couldn't save quote link",
                );
            }
        }

        clearLocalForm();

        if (existing_full?.id) {
            window.location.reload();
        } else {
            window.location.pathname = "/admin/invoices";
        }
    } catch (error: any) {
        setStatus({
            error: true,
            msg: error.message || "Invoice Form Error",
        });

        setLoading(false);
    }
}

import Loading from "@moduletrace/twui/elements/Loading";
import Paper from "@moduletrace/twui/elements/Paper";
import Center from "@moduletrace/twui/layout/Center";
import Span from "@moduletrace/twui/layout/Span";
import Stack from "@moduletrace/twui/layout/Stack";
import InvoiceCard from "./invoice-card";
import useInvoicesListInit from "../(hooks)/use-invoices-list-init";

export default function InvoicesList() {
    const init = useInvoicesListInit({});
    const { invoices } = init;

    return (
        <Stack className="w-full items-stretch">
            {!invoices ? (
                <Paper>
                    <Center className="p-20">
                        <Loading />
                    </Center>
                </Paper>
            ) : !invoices[0] ? (
                <Paper>
                    <Center className="p-20">
                        <Span>No Invoices Found!</Span>
                    </Center>
                </Paper>
            ) : (
                invoices.map((invoice, index) => {
                    return (
                        <InvoiceCard invoice={invoice} key={index} />
                    );
                })
            )}
        </Stack>
    );
}
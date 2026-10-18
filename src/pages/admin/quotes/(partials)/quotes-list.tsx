import Loading from "@moduletrace/twui/elements/Loading";
import Paper from "@moduletrace/twui/elements/Paper";
import Center from "@moduletrace/twui/layout/Center";
import Span from "@moduletrace/twui/layout/Span";
import Stack from "@moduletrace/twui/layout/Stack";
import QuoteCard from "./quote-card";
import useQuotesListInit from "../(hooks)/use-quotes-list-init";

export default function QuotesList() {
    const init = useQuotesListInit({});
    const { quotes } = init;

    return (
        <Stack className="w-full items-stretch">
            {!quotes ? (
                <Paper>
                    <Center className="p-20">
                        <Loading />
                    </Center>
                </Paper>
            ) : !quotes[0] ? (
                <Paper>
                    <Center className="p-20">
                        <Span>No Quotes Found!</Span>
                    </Center>
                </Paper>
            ) : (
                quotes.map((quote, index) => {
                    return (
                        <QuoteCard quote={quote} key={index} />
                    );
                })
            )}
        </Stack>
    );
}
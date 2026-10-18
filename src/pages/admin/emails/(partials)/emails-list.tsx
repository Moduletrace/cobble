import Loading from "@moduletrace/twui/elements/Loading";
import Paper from "@moduletrace/twui/elements/Paper";
import Center from "@moduletrace/twui/layout/Center";
import Span from "@moduletrace/twui/layout/Span";
import Stack from "@moduletrace/twui/layout/Stack";
import useEmailsListInit from "../(hooks)/use-emails-list-init";
import EmailCard from "./email-card";

export default function EmailsList() {
    const init = useEmailsListInit({});
    const { emails, setRes } = init;

    return (
        <Stack className="w-full items-stretch">
            {!emails ? (
                <Paper>
                    <Center className="p-20">
                        <Loading />
                    </Center>
                </Paper>
            ) : !emails[0] ? (
                <Paper>
                    <Center className="p-20">
                        <Span>No Emails Found!</Span>
                    </Center>
                </Paper>
            ) : (
                emails.map((email, index) => {
                    return (
                        <EmailCard
                            email={email}
                            key={index}
                            refresh={() => {
                                setRes(undefined);
                            }}
                        />
                    );
                })
            )}
        </Stack>
    );
}
import Form from "@moduletrace/twui/form/Form";
import LoadingOverlay from "@moduletrace/twui/elements/LoadingOverlay";
import Paper from "@moduletrace/twui/elements/Paper";
import Stack from "@moduletrace/twui/layout/Stack";
import Row from "@moduletrace/twui/layout/Row";
import H3 from "@moduletrace/twui/layout/H3";
import Span from "@moduletrace/twui/layout/Span";
import useFormInit from "@/src/hooks/use-form-init";
import { type ContactFormObject } from "@/src/types";
import submitContactForm from "../../(functions)/submit-contact-form";
import ContactFormName from "./contact-form-name";
import ContactFormEmail from "./contact-form-email";
import ContactFormSubject from "./contact-form-subject";
import ContactFormMessage from "./contact-form-message";
import ContactFormAction from "./contact-form-action";
import ContactFormStatus from "../contact-form-status";
import ContactFormSuccess from "../contact-form-success";

export default function ContactForm() {
    const init = useFormInit<ContactFormObject>();
    const { loading, status, setForm, setStatus } = init;

    return (
        <Paper className="relative w-full p-6 sm:p-10 rounded-default-xl bg-white">
            {loading && <LoadingOverlay />}
            <Stack className="w-full gap-8!">
                <Row className="w-full items-start justify-between gap-4!">
                    <Stack className="gap-2!">
                        <H3>Send a message</H3>
                        <Span className="text-sm text-slate-500 dark:text-slate-400">
                            Fields marked * are required.
                        </Span>
                    </Stack>
                    <Span className="text-xs text-slate-400">
                        Form / 01
                    </Span>
                </Row>
                {status?.success ? (
                    <ContactFormSuccess
                        msg={status.msg}
                        onReset={() => {
                            setForm({} as ContactFormObject);
                            setStatus(undefined);
                        }}
                    />
                ) : (
                    <Form
                        className="w-full"
                        onSubmit={() => {
                            submitContactForm(init);
                        }}
                    >
                        <Stack className="w-full items-stretch gap-5!">
                            <div className="grid w-full grid-cols-1 sm:grid-cols-2 gap-5">
                                <ContactFormName {...init} />
                                <ContactFormEmail {...init} />
                            </div>
                            <ContactFormSubject {...init} />
                            <ContactFormMessage {...init} />
                            <ContactFormStatus status={status} />
                            <ContactFormAction {...init} />
                        </Stack>
                    </Form>
                )}
            </Stack>
        </Paper>
    );
}

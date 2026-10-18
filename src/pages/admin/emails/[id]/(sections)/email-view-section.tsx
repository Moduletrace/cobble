import Card from "@moduletrace/twui/elements/Card";
import H3 from "@moduletrace/twui/layout/H3";
import Section from "@moduletrace/twui/layout/Section";
import Button from "@moduletrace/twui/layout/Button";
import Row from "@moduletrace/twui/layout/Row";
import { AppContext } from "@/src/pages/__root";
import { useContext } from "react";
import EmailDetails from "../(partials)/email-details";
import EmailActions from "../../(partials)/email-actions";

export default function EmailViewSection() {
    const { pageProps } = useContext(AppContext);

    const email = pageProps?.email;
    const attachments = pageProps?.attachments;

    if (!email) return null;

    return (
        <Section>
            <Card className="flex-col items-stretch w-full">
                <Row className="w-full justify-between items-start">
                    <EmailActions
                        email={email}
                        refresh={() => {
                            window.location.reload();
                        }}
                        is_single_email_page
                    />
                </Row>

                <EmailDetails email={email} attachments={attachments} />
            </Card>
        </Section>
    );
}

import AdminHero from "@/src/components/general/admin-hero";
import EmptyContent from "@moduletrace/twui/elements/EmptyContent";
import useStatus from "@moduletrace/twui/hooks/useStatus";
import Button from "@moduletrace/twui/layout/Button";
import { AppContext } from "@/src/pages/__root";
import { useContext } from "react";
import clientSendEmail from "../../(functions)/client-send-email";
import Tag from "@moduletrace/twui/elements/Tag";
import isReadOnlyUser from "@/src/utils/rbac/is-read-only-user";

export default function Hero() {
    const { pageProps } = useContext(AppContext);

    const email = pageProps?.email;

    const is_read_only = isReadOnlyUser({
        user_types: pageProps?.user_types,
    });

    const {
        loading: sendEmailLoading,
        setLoading: setSendEmailLoading,
        status,
        setStatus,
    } = useStatus();

    if (!email?.id) {
        return <EmptyContent title="Email Record no found!" />;
    }

    return (
        <>
            <AdminHero
                title={email.title || email.subject || "Untitled Email"}
                description={
                    <>
                        {status?.msg ? (
                            <Tag
                                color={
                                    status.error
                                        ? "error"
                                        : status.success
                                          ? "success"
                                          : undefined
                                }
                            >
                                {status.msg}
                            </Tag>
                        ) : null}
                    </>
                }
                buttons={
                    <>
                        <Button
                            title="All Emails"
                            href="/admin/emails"
                            variant="outlined"
                            color="gray"
                        >
                            All Emails
                        </Button>
                        {is_read_only ? null : (
                            <Button
                                title="Edit Email"
                                href={`/admin/emails/${email.id}/edit`}
                                variant="outlined"
                            >
                                Edit Email
                            </Button>
                        )}
                        {is_read_only || email.status == "sent" ? null : (
                            <Button
                                title="Edit Email"
                                color="secondary"
                                loading={sendEmailLoading}
                                onClick={() => {
                                    clientSendEmail({
                                        email,
                                        setLoading: setSendEmailLoading,
                                        refresh() {
                                            setSendEmailLoading(false);
                                        },
                                        setStatus,
                                    });
                                }}
                                loadingProps={{
                                    size: "small",
                                }}
                            >
                                Send Email
                            </Button>
                        )}
                    </>
                }
            />
        </>
    );
}

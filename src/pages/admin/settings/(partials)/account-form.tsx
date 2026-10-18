import Form from "@moduletrace/twui/form/Form";
import LoadingOverlay from "@moduletrace/twui/elements/LoadingOverlay";
import useFormInit from "@/src/hooks/use-form-init";
import type { BUN_SQLITE_COBBLE_USERS } from "@/db/types/db";
import submitAccountForm from "../(functions)/submit-account-form";
import AccountFormAction from "./account-form-action";
import Tag from "@moduletrace/twui/elements/Tag";
import Row from "@moduletrace/twui/layout/Row";
import UserFormName from "@/src/pages/admin/people/create/(partials)/user-form/user-form-name";
import UserFormEmail from "@/src/pages/admin/people/create/(partials)/user-form/user-form-email";
import UserFormUsername from "@/src/pages/admin/people/create/(partials)/user-form/user-form-username";
import UserFormBio from "@/src/pages/admin/people/create/(partials)/user-form/user-form-bio";
import UserFormImage from "@/src/pages/admin/people/create/(partials)/user-form/user-form-image";
import type { UserFormObject } from "@/src/types";

type Props = {
    existing_user?: UserFormObject;
    existing_user_full?: BUN_SQLITE_COBBLE_USERS;
};

export default function AccountForm({ existing_user, existing_user_full }: Props) {
    const init = useFormInit<UserFormObject>({
        existing: existing_user,
        existing_full: existing_user_full,
    });

    const { loading, status } = init;

    return (
        <>
            <Form
                className="w-full gap-6"
                onSubmit={() => {
                    submitAccountForm(init);
                }}
            >
                {status?.error && <Tag color="error">{status.msg}</Tag>}
                {loading && <LoadingOverlay />}

                <UserFormName {...init} />
                <Row className="w-full grid xl:grid-cols-2">
                    <UserFormEmail {...init} />
                    <UserFormUsername {...init} />
                </Row>
                <Row className="w-full grid xl:grid-cols-2 items-stretch">
                    <UserFormBio {...init} />
                    <UserFormImage {...init} />
                </Row>
                <AccountFormAction {...init} />
            </Form>
        </>
    );
}
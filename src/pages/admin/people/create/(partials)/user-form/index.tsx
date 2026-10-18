import Form from "@moduletrace/twui/form/Form";
import LoadingOverlay from "@moduletrace/twui/elements/LoadingOverlay";
import useFormInit from "@/src/hooks/use-form-init";
import type { BUN_SQLITE_BSQLITE_USERS } from "@/db/types/db";
import submitUserForm from "../../(functions)/submit-user-form";
import UserFormName from "./user-form-name";
import Tag from "@moduletrace/twui/elements/Tag";
import UserFormAction from "./user-form-action";
import UserFormEmail from "./user-form-email";
import UserFormUsername from "./user-form-username";
import Row from "@moduletrace/twui/layout/Row";
import type { UserFormObject } from "@/src/types";
import UserFormUserTypes from "./user-form-user-types";
import UserFormBio from "./user-form-bio";
import UserFormImage from "./user-form-image";

type Props = {
    existing_user?: UserFormObject;
    existing_user_full?: BUN_SQLITE_BSQLITE_USERS;
};

export default function UserForm({ existing_user, existing_user_full }: Props) {
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
                    submitUserForm(init);
                }}
            >
                {status?.error && <Tag color="error">{status.msg}</Tag>}
                {loading && <LoadingOverlay />}

                <UserFormName {...init} />
                <Row className="w-full grid xl:grid-cols-2">
                    <UserFormEmail {...init} />
                    <UserFormUsername {...init} />
                </Row>
                <UserFormUserTypes {...init} />
                <Row className="w-full grid xl:grid-cols-2 items-stretch">
                    <UserFormBio {...init} />
                    <UserFormImage {...init} />
                </Row>
                <UserFormAction {...init} />
            </Form>
        </>
    );
}

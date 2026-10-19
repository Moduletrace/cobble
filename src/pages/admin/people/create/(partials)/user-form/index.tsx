import Form from "@moduletrace/twui/form/Form";
import Row from "@moduletrace/twui/layout/Row";
import useFormInit from "@/src/hooks/use-form-init";
import { UneditableUserTypes } from "@/src/dict/user-types-dict";
import type { UserFormObject } from "@/src/types";
import type { BUN_SQLITE_COBBLE_USERS_JOIN } from "@/src/types/sql-joins";
import parseIdList from "@/src/utils/parse-id-list";
import parseUserTypes from "@/src/utils/parse-user-types";
import submitUserForm from "../../(functions)/submit-user-form";
import UserFormName from "./user-form-name";
import UserFormAction from "./user-form-action";
import UserFormEmail from "./user-form-email";
import UserFormUsername from "./user-form-username";
import UserFormUserTypes from "./user-form-user-types";
import UserFormAccess from "./user-form-access";
import UserFormImage from "./user-form-image";
import UserFormPassword from "./user-form-password";

type Props = {
    /**
     * Edits this user; adds one when not given.
     */
    person?: BUN_SQLITE_COBBLE_USERS_JOIN;
    /**
     * Called with the saved user instead of reloading the page.
     */
    onSaved?: (params: { person: BUN_SQLITE_COBBLE_USERS_JOIN; msg: string }) => void;
    onCancel?: () => void;
};

/**
 * A user's photo, name, email, username, user types, what they reach
 * (bots and workspaces) and password, saved in one go through
 * `users/save-user`.
 */
export default function UserForm({ person, onSaved, onCancel }: Props) {
    const init = useFormInit<UserFormObject>({
        existing: person
            ? {
                  first_name: person.first_name,
                  last_name: person.last_name,
                  email: person.email,
                  username: person.username,
                  user_types: parseUserTypes({ user_types: person.user_types }).filter(
                      (type) => !UneditableUserTypes.includes(type),
                  ),
                  bot_ids: parseIdList({ ids: person.bot_ids }),
                  workspace_ids: parseIdList({ ids: person.workspace_ids }),
              }
            : undefined,
        existing_full: person ? { id: person.id } : undefined,
        default: { user_types: ["member"] },
    });

    return (
        <Form className="w-full gap-4! items-stretch pt-4" onSubmit={() => submitUserForm({ ...init, onSaved })}>
            <UserFormImage {...init} person={person} />
            <UserFormName {...init} />
            <Row className="w-full grid sm:grid-cols-2 gap-4!">
                <UserFormEmail {...init} />
                <UserFormUsername {...init} />
            </Row>
            <UserFormUserTypes {...init} person={person} />
            <UserFormAccess {...init} person={person} />
            <UserFormPassword {...init} />
            <UserFormAction {...init} onCancel={onCancel} />
        </Form>
    );
}

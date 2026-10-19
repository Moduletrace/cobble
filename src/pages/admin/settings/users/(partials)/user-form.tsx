import Form from "@moduletrace/twui/form/Form";
import Input from "@moduletrace/twui/form/Input";
import Row from "@moduletrace/twui/layout/Row";
import { useContext, useState } from "react";
import { UneditableUserTypes } from "@/src/dict/user-types-dict";
import postAdminApi from "@/src/layouts/bots/(functions)/post-admin-api";
import AddFormActions from "@/src/layouts/bots/(partials)/add-form-actions";
import type { BUN_SQLITE_COBBLE_USERS_JOIN } from "@/src/types/sql-joins";
import { AppContext } from "@/src/pages/__root";
import type { UserType } from "@/src/types";
import parseUserTypes from "@/src/utils/parse-user-types";
import UserPasswordFields from "./user-password-fields";
import UserTypesSelect from "./user-types-select";

type Props = {
    /**
     * Edits this user; adds one when not given.
     */
    person?: BUN_SQLITE_COBBLE_USERS_JOIN;
    onCancel: () => void;
    onSaved: (params: { person: BUN_SQLITE_COBBLE_USERS_JOIN; msg: string }) => void;
};

/**
 * A user's name, email, username, password (twice, to confirm) and user
 * types. Uneditable types (`super_admin`) aren't offered, and the super
 * admin's types aren't shown at all: they never change here.
 */
export default function UserForm({ person, onCancel, onSaved }: Props) {
    const { pageProps } = useContext(AppContext);
    const current_types = parseUserTypes({ user_types: person?.user_types });
    const is_super_admin = current_types.includes("super_admin");

    const [first_name, setFirstName] = useState(person?.first_name || "");
    const [last_name, setLastName] = useState(person?.last_name || "");
    const [email, setEmail] = useState(person?.email || "");
    const [username, setUsername] = useState(person?.username || "");
    const [password, setPassword] = useState("");
    const [confirm_password, setConfirmPassword] = useState("");
    const [user_types, setUserTypes] = useState<UserType[]>(
        person ? current_types.filter((type) => !UneditableUserTypes.includes(type)) : ["member"],
    );
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string>();

    const submit = async () => {
        if (loading) return;

        if (password != confirm_password) {
            setError("The passwords don't match.");
            return;
        }

        setLoading(true);
        setError(undefined);

        const res = await postAdminApi<BUN_SQLITE_COBBLE_USERS_JOIN>({
            path: "users/save-user",
            body: {
                user_id: person?.id || null,
                first_name,
                last_name,
                email,
                username,
                password,
                confirm_password,
                user_types: is_super_admin ? [] : user_types,
            },
        });

        setLoading(false);

        if (!res.success || !res.singleRes?.id) {
            setError(res.msg || "Couldn't save the user.");
            return;
        }

        onSaved({ person: res.singleRes, msg: res.msg || "Saved." });
    };

    return (
        <Form className="w-full gap-4! items-stretch pt-4" onSubmit={submit}>
            <Row className="w-full gap-4! flex-nowrap items-start">
                <Input
                    id="user-form-first-name"
                    title="First name"
                    label="First name"
                    showLabel
                    placeholder="Ada"
                    autoComplete="off"
                    defaultValue={first_name}
                    wrapperWrapperProps={{ className: "grow min-w-0" }}
                    onChange={(e) => setFirstName(e.target.value)}
                />
                <Input
                    id="user-form-last-name"
                    title="Last name"
                    label="Last name"
                    showLabel
                    placeholder="Lovelace"
                    autoComplete="off"
                    defaultValue={last_name}
                    wrapperWrapperProps={{ className: "grow min-w-0" }}
                    onChange={(e) => setLastName(e.target.value)}
                />
            </Row>
            <Input
                id="user-form-email"
                title="Email"
                label="Email"
                showLabel
                type="email"
                placeholder="ada@example.com"
                autoComplete="off"
                defaultValue={email}
                onChange={(e) => setEmail(e.target.value)}
            />
            <Input
                id="user-form-username"
                title="Username"
                label="Username"
                showLabel
                placeholder="ada"
                autoComplete="off"
                defaultValue={username}
                info="Lowercase letters, numbers, dots, dashes or underscores."
                onChange={(e) => setUsername(e.target.value)}
            />
            {is_super_admin ? null : (
                <UserTypesSelect actor_user_types={pageProps?.user_types} value={user_types} onChange={setUserTypes} />
            )}
            <UserPasswordFields optional={Boolean(person)} onPassword={setPassword} onConfirm={setConfirmPassword} />
            <AddFormActions
                submit_label={person ? "Save" : "Add user"}
                loading={loading}
                error={error}
                onCancel={onCancel}
            />
        </Form>
    );
}

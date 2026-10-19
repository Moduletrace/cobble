import SearchSelect from "@moduletrace/twui/form/SearchSelect";
import { UneditableUserTypes, UserTypes } from "@/src/dict/user-types-dict";
import useFormInit from "@/src/hooks/use-form-init";
import type { UserFormObject, UserType } from "@/src/types";
import type { BUN_SQLITE_COBBLE_USERS_JOIN } from "@/src/types/sql-joins";
import parseUserTypes from "@/src/utils/parse-user-types";
import filterAssignableUserTypes from "@/src/utils/rbac/filter-assignable-user-types";

type Props = ReturnType<typeof useFormInit<UserFormObject>> & {
    person?: BUN_SQLITE_COBBLE_USERS_JOIN;
};

/**
 * Picks a user's types, offering only those the session user may grant
 * (never `super_admin`). The super admin's types aren't shown: they never
 * change here.
 */
export default function UserFormUserTypes({
    setForm,
    form,
    person,
    app_context,
}: Props) {
    if (parseUserTypes({ user_types: person?.user_types }).includes("super_admin")) {
        return null;
    }

    const assignable = filterAssignableUserTypes({
        actor_user_types: app_context.pageProps?.user_types,
        user_types: UserTypes.map((type) => type.value).filter((type) => !UneditableUserTypes.includes(type)),
    });

    return (
        <SearchSelect
            id="user-form-user-types"
            title="User types"
            label="User types"
            showLabel
            multiple
            placeholder="Pick their user types"
            options={UserTypes.filter((type) => assignable.includes(type.value)).map((type) => ({
                value: type.value,
                title: type.title,
            }))}
            defaultValues={form.user_types || []}
            info="At least one, or they can't sign in."
            changeHandler={(value) => {
                const user_types = (Array.isArray(value) ? value : value ? [value] : []) as UserType[];
                setForm((prev) => ({ ...prev, user_types }));
            }}
        />
    );
}

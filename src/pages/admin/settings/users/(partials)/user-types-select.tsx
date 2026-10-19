import SearchSelect from "@moduletrace/twui/form/SearchSelect";
import type { BUN_SQLITE_COBBLE_USER_TYPES } from "@/db/types/db";
import { UneditableUserTypes, UserTypes } from "@/src/dict/user-types-dict";
import type { UserType } from "@/src/types";
import filterAssignableUserTypes from "@/src/utils/rbac/filter-assignable-user-types";

type Props = {
    /**
     * The session user's types: only what they may grant is offered.
     */
    actor_user_types?: BUN_SQLITE_COBBLE_USER_TYPES[] | null;
    value: UserType[];
    onChange: (user_types: UserType[]) => void;
};

/**
 * Picks a user's types from `UserTypes`, leaving out the uneditable ones
 * (`super_admin`) and any the assignment matrix keeps from the actor.
 */
export default function UserTypesSelect({ actor_user_types, value, onChange }: Props) {
    const assignable = filterAssignableUserTypes({
        actor_user_types,
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
            defaultValues={value}
            info="At least one, or they can't sign in."
            changeHandler={(next) =>
                onChange((Array.isArray(next) ? next : next ? [next] : []) as UserType[])
            }
        />
    );
}

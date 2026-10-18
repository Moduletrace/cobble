import SearchSelect from "@moduletrace/twui/form/SearchSelect";
import { UneditableUserTypes, UserTypes } from "@/src/dict/user-types-dict";
import useFormInit from "@/src/hooks/use-form-init";
import type { UserFormObject, UserType } from "@/src/types";

export default function UserFormUserTypes({
    setForm,
    form,
}: ReturnType<typeof useFormInit<UserFormObject>>) {
    return (
        <>
            <SearchSelect
                multiple
                options={UserTypes.filter(
                    (ut) => !UneditableUserTypes.includes(ut.value),
                ).map((ut) => ({
                    value: ut.value,
                }))}
                defaultValues={form.user_types || []}
                changeHandler={(value) => {
                    const user_types = Array.isArray(value)
                        ? (value as UserType[])
                        : value
                          ? ([value] as UserType[])
                          : [];
                    setForm({ ...form, user_types });
                }}
                title="User Types"
                showLabel
            />
        </>
    );
}

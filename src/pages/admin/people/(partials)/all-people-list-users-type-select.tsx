import _ from "lodash";
import type useAllPeopleListInit from "../(hooks)/use-all-people-list-init";
import { UserTypes } from "@/src/dict/user-types-dict";
import SearchSelect from "@moduletrace/twui/form/SearchSelect";

export default function AllPeopleListUsersTypeSelect({
    setUsersQuery,
    location_query,
}: ReturnType<typeof useAllPeopleListInit>) {
    const initial_user_type = String(location_query?.target_user_type || "");

    const options = [
        { value: "N/A", label: "All Users" },
        ...UserTypes.map((ut) => ({
            value: ut.value,
            label: ut.value,
        })),
    ];

    return (
        <div className="flex flex-col gap-1">
            <SearchSelect
                options={options}
                defaultValues={[initial_user_type]}
                changeHandler={(value) => {
                    setUsersQuery((prev) => {
                        const new_query = _.cloneDeep(prev) || {};
                        if (!value || value === "N/A") {
                            delete new_query?.target_user_type;
                        } else {
                            new_query.target_user_type = value as any;
                        }
                        return new_query;
                    });
                }}
            />
        </div>
    );
}

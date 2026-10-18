import Search from "@moduletrace/twui/elements/Search";
import Select from "@moduletrace/twui/form/Select";
import Divider from "@moduletrace/twui/layout/Divider";
import { useRef } from "react";
import _ from "lodash";
import twuiSlugToNormalText from "@moduletrace/twui/utils/slug-to-normal-text";
import type useAllPeopleListInit from "../(hooks)/use-all-people-list-init";
import type { BUN_SQLITE_COBBLE_USERS_JOIN } from "@/src/types/sql-joins";
import searchableFieldToQueryField from "@/src/utils/searchable-field-to-query-field";
import type { ApiReqParams } from "@/src/types";

export default function AllPeopleListSearch({
    setUsersQuery,
    location_query,
}: ReturnType<typeof useAllPeopleListInit>) {
    const searchable_fields: (keyof BUN_SQLITE_COBBLE_USERS_JOIN)[] = [
        "first_name",
        "last_name",
        "email",
        "user_types",
    ];

    const initial_search_field = (Object.keys(location_query || {}).filter(
        (q) => q.startsWith("search_term"),
    )?.[0] ||
        searchableFieldToQueryField({
            field: searchable_fields[0]!,
        })) as keyof ApiReqParams;

    const initial_search = String(location_query?.[initial_search_field] || "");

    const search_field_ref = useRef(initial_search_field);
    const search_value_ref = useRef(initial_search);
    const initialized_ref = useRef(false);

    function appendQuery() {
        setUsersQuery((prev) => {
            let nq = _.cloneDeep(prev) || {};

            for (let i = 0; i < searchable_fields.length; i++) {
                const sf = searchableFieldToQueryField({
                    field: searchable_fields[i]!,
                });
                delete nq[sf];
            }

            if (search_value_ref.current.match(/./)) {
                nq[search_field_ref.current] = search_value_ref.current;
            }

            nq.page = 1;

            if (_.isEqual(nq, prev)) {
                return prev;
            }

            return nq;
        });
    }

    return (
        <Search
            placeholder="Find People"
            changeHandler={(value) => {
                search_value_ref.current = value || "";

                if (!initialized_ref.current) {
                    initialized_ref.current = true;
                    if ((value || "") === initial_search) {
                        return;
                    }
                }

                appendQuery();
            }}
            defaultValue={initial_search}
            no_search_button
            inputProps={{
                suffix: (
                    <>
                        <Divider vertical className="-my-4 -mr-2 h-9" />
                        <Select
                            options={searchable_fields.map((sf) => ({
                                value: sf,
                                default:
                                    searchableFieldToQueryField({
                                        field: sf,
                                    }) == search_field_ref.current,
                                title: twuiSlugToNormalText(
                                    sf.replace(/user_types/, "user_type"),
                                ),
                            }))}
                            className="-my-4 min-w-[80px] xs:min-w-[150px] -mr-2 pl-4"
                            wrapperWrapperProps={{
                                className: "-mr-2",
                            }}
                            wrapperProps={{
                                className: "border-none!",
                            }}
                            changeHandler={(value) => {
                                search_field_ref.current =
                                    searchableFieldToQueryField({
                                        field: value,
                                    });
                                appendQuery();
                            }}
                        />
                    </>
                ),
                autoFocus: true,
            }}
        />
    );
}

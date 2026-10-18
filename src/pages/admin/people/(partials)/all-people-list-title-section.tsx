import Row from "@moduletrace/twui/layout/Row";
import _ from "lodash";
import { AppData } from "@/src/data/app-data";
import type useAllPeopleListInit from "../(hooks)/use-all-people-list-init";
import AllPeopleListSearch from "./all-people-list-search";
import AllPeopleListUsersTypeSelect from "./all-people-list-users-type-select";

export default function AllPeopleListTitleSection(
    props: ReturnType<typeof useAllPeopleListInit>,
) {
    const { users_type, people, page, count } = props;

    const limit = AppData["DefaultQueryLimit"];

    const range_start = people?.length ? (page - 1) * limit + 1 : 0;
    const range_end = people?.length ? range_start + people.length - 1 : 0;

    return (
        <Row className="flex items-center justify-between gap-4 w-full">
            <Row>
                <AllPeopleListSearch {...props} />
                {users_type ? null : (
                    <AllPeopleListUsersTypeSelect {...props} />
                )}
            </Row>

            {typeof count === "number" && count > 0 ? (
                <p className="text-sm text-muted-foreground">
                    Showing {range_start}-{range_end} of {count} users
                </p>
            ) : (
                <span className="text-sm text-muted-foreground">
                    No Results
                </span>
            )}
        </Row>
    );
}

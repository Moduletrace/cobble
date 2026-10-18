import Loading from "@moduletrace/twui/elements/Loading";
import Center from "@moduletrace/twui/layout/Center";
import Span from "@moduletrace/twui/layout/Span";
import Stack from "@moduletrace/twui/layout/Stack";
import PeopleListCard from "./people-list-card";
import Paper from "@moduletrace/twui/elements/Paper";
import AllPeopleListSelections from "./all-people-list-selections";
import useAllPeopleListInit from "../(hooks)/use-all-people-list-init";
import AllPeopleListSearch from "./all-people-list-search";

export default function PeopleList() {
    const init = useAllPeopleListInit({});

    const { people } = init;

    return (
        <Stack className="w-full items-stretch">
            <AllPeopleListSearch {...init} />
            <AllPeopleListSelections {...init} />

            {!people ? (
                <Paper>
                    <Center className="p-20">
                        <Loading />
                    </Center>
                </Paper>
            ) : !people[0] ? (
                <Paper>
                    <Center className="p-20">
                        <Span>No People Found!</Span>
                    </Center>
                </Paper>
            ) : (
                people.map((person, index) => {
                    return <PeopleListCard person={person} key={index} />;
                })
            )}
        </Stack>
    );
}

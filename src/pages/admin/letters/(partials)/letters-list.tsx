import Loading from "@moduletrace/twui/elements/Loading";
import Paper from "@moduletrace/twui/elements/Paper";
import Center from "@moduletrace/twui/layout/Center";
import Span from "@moduletrace/twui/layout/Span";
import Stack from "@moduletrace/twui/layout/Stack";
import useLettersListInit from "../(hooks)/use-letters-list-init";
import LetterCard from "./letter-card";

export default function LettersList() {
    const init = useLettersListInit({});
    const { letters } = init;

    return (
        <Stack className="w-full items-stretch">
            {!letters ? (
                <Paper>
                    <Center className="p-20">
                        <Loading />
                    </Center>
                </Paper>
            ) : !letters[0] ? (
                <Paper>
                    <Center className="p-20">
                        <Span>No Letters Found!</Span>
                    </Center>
                </Paper>
            ) : (
                letters.map((letter, index) => {
                    return <LetterCard letter={letter} key={index} />;
                })
            )}
        </Stack>
    );
}
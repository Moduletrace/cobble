import Row from "@moduletrace/twui/layout/Row";
import Button from "@moduletrace/twui/layout/Button";
import { twMerge } from "tailwind-merge";
import { useAuthStatus } from "@/src/hooks/use-auth-status";

type Props = {
    className?: string;
};

export default function HeaderCTA({ className }: Props) {
    const { is_logged_in } = useAuthStatus();

    if (is_logged_in) {
        return null;
    }

    return (
        <Row className={twMerge("flex-col", className)}>
            <Button
                title="Log in"
                href="/auth/login"
                color="gray"
                variant="outlined"
                className="w-full"
            >
                Log in
            </Button>
            <Button title="Get Started" href="/auth/signup" className="w-full">
                Get Started
            </Button>
        </Row>
    );
}
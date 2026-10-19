import React from "react";
import Stack from "@moduletrace/twui/layout/Stack";
import Main from "@moduletrace/twui/layout/Main";
import AuthTopBar from "./(partials)/auth-top-bar";
import AuthBottomBar from "./(partials)/auth-bottom-bar";

type Props = {
    children: React.ReactNode;
};

/**
 * Distraction-free layout for `/auth/*`: logo and theme switch on top,
 * centered content, copyright at the bottom. No site header or footer.
 */
export default function AuthLayout({ children }: Props): React.JSX.Element {
    return (
        <Stack className="w-full min-h-dvh items-stretch gap-0! bg-light dark:bg-black">
            <AuthTopBar />
            <Main className="grow justify-center">{children}</Main>
            <AuthBottomBar />
        </Stack>
    );
}

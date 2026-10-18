import React from "react";
import Header from "./(sections)/Header";
import Footer from "./(sections)/Footer";
import { AppContext } from "@/src/pages/__root";
import Stack from "@moduletrace/twui/layout/Stack";

type Props = {
    children: React.ReactNode;
    blank?: boolean;
};

export default function Layout({ children, blank }: Props): React.JSX.Element {
    const {} = React.useContext(AppContext);

    return (
        <React.Fragment>
            <Stack className="w-full items-stretch gap-0">
                {blank ? null : <Header />}
                <main>{children}</main>
                {blank ? null : <Footer />}
            </Stack>
        </React.Fragment>
    );
}
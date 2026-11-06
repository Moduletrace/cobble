"use client";

import AppNetworkRow from "./app-network-row";

type Props = {
    name: string;
};

/**
 * A network the container is on that isn't in the list (the computers'
 * network, the installer's `--extra-network`): shown, never removed here.
 */
export default function AppNetworkFixedItem({ name }: Props) {
    return (
        <AppNetworkRow
            name={name}
            badge="Always joined"
            subtitle="Joined by the installer or for computers. Not changed here."
        />
    );
}

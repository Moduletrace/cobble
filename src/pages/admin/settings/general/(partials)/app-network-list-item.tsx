"use client";

import type { AppNetworksOverview } from "@/src/types";
import appNetworkSubtitle from "../(utils)/app-network-subtitle";
import AppNetworkRow from "./app-network-row";

type Props = {
    name: string;
    network?: AppNetworksOverview["networks"][number];
    disabled?: boolean;
    onRemove: (params: { name: string }) => void;
};

/**
 * A network in the editable list, with its status read from the last sync.
 */
export default function AppNetworkListItem({ name, network, disabled, onRemove }: Props) {
    return (
        <AppNetworkRow
            name={name}
            subtitle={appNetworkSubtitle({ network })}
            disabled={disabled}
            onRemove={() => onRemove({ name })}
        />
    );
}

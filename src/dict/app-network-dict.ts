/**
 * The app setting holding the extra docker networks the app's own
 * container joins (a JSON array of names). Kept in the database, so it
 * outlasts the container being recreated on an update.
 */
export const AppExtraNetworksSettingKey = "app_extra_networks";

/**
 * Docker's own network names a container can't be connected to by name.
 */
export const AppNetworkReservedNames = ["host", "none"] as const;

/**
 * What a network name may look like (docker's own rule).
 */
export const AppNetworkNameRegex = /^[A-Za-z0-9][A-Za-z0-9_.-]{0,127}$/;

/**
 * Where the app stands on one of its extra networks: on it, the network
 * doesn't exist, docker refused, or (a server outside docker) there's no
 * container to connect yet.
 */
export const AppNetworkStatuses = ["connected", "missing", "failed", "idle"] as const;

export type AppNetworkStatus = (typeof AppNetworkStatuses)[number];

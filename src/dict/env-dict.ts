import { HarnessProviderKinds } from "./harness-provider-dict";

/**
 * Where an env applies. A bot's own env beats the computer it runs on,
 * which beats the workspace it works in, which beats a general one.
 */
export const EnvParadigms = [
    {
        title: "General",
        value: "general",
    },
    {
        title: "Workspace",
        value: "workspace",
    },
    {
        title: "Computer",
        value: "computer",
    },
    {
        title: "Bot",
        value: "bot",
    },
] as const;

export type EnvParadigm = (typeof EnvParadigms)[number]["value"];

export type KnownEnv = {
    key: string;
    description: string;
    required: boolean;
    /**
     * Hidden once saved; only replaced, never shown.
     */
    secret: boolean;
};

/**
 * Envs the app itself reads (`grabEnv`), set in Settings, under
 * Environment. They are general only and never go to computers. Users add
 * their own keys beside these for bots and computers to use.
 *
 * Not here, and never in the `envs` table: `ENCRYPTION_KEY` and
 * `ENCRYPTION_SALT` (they encrypt the table), and `PORT`, `DATA_DIR`,
 * `BACKUP_ARCHIVE_DIR` and `MAIN_SERVER` (the container's own start-up
 * settings). Those stay in the process environment.
 */
export const EnvDict: readonly KnownEnv[] = [
    {
        key: "VAPID_PUBLIC_KEY",
        description:
            "Web Push public key, shared with browsers that subscribe. Generated on first start when missing.",
        required: false,
        secret: false,
    },
    {
        key: "VAPID_PRIVATE_KEY",
        description:
            "Web Push private key, used to sign notifications. Generated on first start when missing; never share it.",
        required: false,
        secret: true,
    },
    {
        key: "MAIN_COMPUTER_URL",
        description: `The main computer's address, for a server running outside docker (e.g. http://localhost:8170). Empty uses the docker network.`,
        required: false,
        secret: false,
    },
    {
        key: "MAIN_COMPUTER_DATA_DIR",
        description: `Where the main computer's workspace (/home/gem/workspace, the only folder bots work in) is on this server's disk, for a computer the app didn't create itself (see MAIN_COMPUTER_URL), e.g. the bind mount your sandbox's compose file uses. Empty reads DATA_DIR/computers/<id>.`,
        required: false,
        secret: false,
    },
    ...HarnessProviderKinds.flatMap((provider) =>
        provider.key_env
            ? [
                  {
                      key: provider.key_env,
                      description: `${provider.title} key, used when the provider has no key of its own.`,
                      required: false,
                      secret: true,
                  },
              ]
            : [],
    ),
];

/**
 * Keys that must stay in the process environment.
 */
export const ProcessOnlyEnvKeys = [
    "ENCRYPTION_KEY",
    "ENCRYPTION_SALT",
    "PORT",
    "DATA_DIR",
    "DB_DIR",
    "BACKUP_ARCHIVE_DIR",
    "MAIN_SERVER",
] as const;

/**
 * What an env key may look like: a shell variable name.
 */
export const EnvKeyRegex = /^[A-Za-z_][A-Za-z0-9_]{0,127}$/;

type Params = {
    bot_kind?: string | null;
    computer_kind?: string | null;
};

/**
 * The coordinator always has the main computer. That one access is granted
 * with the account and can never be removed; every other bot/computer pair
 * can be added and removed freely.
 */
export default function isLockedComputerAccess({
    bot_kind,
    computer_kind,
}: Params) {
    return bot_kind == "coordinator" && computer_kind == "main";
}

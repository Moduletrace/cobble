/**
 * Chrome Web Store extensions every computer's browser gets, installed by
 * a managed policy (`computerBrowserPolicy`, written by
 * `syncComputerBrowserPolicy`). They're installed as `normal_installed`:
 * a user can turn one off in that browser, but not remove it.
 * Cookie-Editor carries a sign-in over from the user's own browser (help:
 * "Google won't let me sign in on a computer").
 */
export const ComputerBrowserExtensions: ReadonlyArray<{ id: string; name: string }> = [
    { id: "hlkenndednhfkekhgcdicdfddnkalmdm", name: "Cookie-Editor" },
];

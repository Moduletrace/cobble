/**
 * Chrome preferences a computer's browser profile starts with, written
 * only when the profile has none (`prepareComputerBrowserDir`) so whatever
 * Chrome saves later (site permissions, settings) is kept. The sandbox
 * image's own preferences (`/opt/gem/preferences.json`), minus its
 * session-only cookie rule (`cookies: 4`), which signs every site out
 * whenever Chrome exits.
 */
export const ComputerBrowserPreferences = {
    credentials_enable_service: false,
    credentials_enable_autosignin: false,
    autofill: {
        credit_card_enabled: false,
        profile_enabled: false,
    },
    password_manager_enabled: false,
    browser: {
        custom_chrome_frame: false,
        show_home_button: true,
        window_placement: { maximized: true },
    },
    bookmark_bar: { show_on_all_tabs: false },
    sync_promo: { show_on_first_run_allowed: false },
    profile: {
        avatar_index: 19,
        default_content_setting_values: {
            clipboard: 2,
            geolocation: 2,
            media_stream_camera: 2,
            media_stream_mic: 2,
            midi_sysex: 2,
            payment_handler: 2,
            usb_guard: 2,
        },
        name: "gem",
        using_default_avatar: false,
        using_default_name: false,
        using_gaia_avatar: false,
    },
    signin: { allowed: false },
    intl: {
        selected_languages: "en-US,en",
        accept_languages: "en-US,en",
    },
    download: {
        default_directory: "/home/gem/Downloads",
        prompt_for_download: false,
        directory_upgrade: true,
    },
    savefile: { default_directory: "/home/gem/Downloads" },
};

import SettingsGroup from "../../(partials)/settings-group";
import ThemePicker from "../(partials)/theme-picker";

export default function AppearanceSection() {
    return (
        <SettingsGroup
            title="Theme"
            description="Saved on this device only, so each computer can have its own."
        >
            <ThemePicker />
        </SettingsGroup>
    );
}

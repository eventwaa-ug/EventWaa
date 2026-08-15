import "./Maintenance.css";
import { usePlatformSettings } from "../context/PlatformSettingsContext.jsx";
function Maintenance() {
  const { settings } = usePlatformSettings();

  return (
    <div className="maintenance-page">
      <div className="maintenance-card">
        <div className="maintenance-brand">
            {settings.platformLogo ? (
                <img
                src={settings.platformLogo}
                alt={settings.platformName}
                className="maintenance-logo"
                />
            ) : (
                <h1>{settings.platformName}</h1>
            )}
            </div>

            <h2>We're currently under maintenance</h2>

            <p>
            We're making improvements to give you a better EventWaa experience.
            Please check back soon.
            </p>
        <div className="maintenance-status">
          <span></span>
          Maintenance in progress
        </div>
        <p className="maintenance-note">
          Thank you for your patience.
        </p>
      </div>
    </div>
  );
}
export default Maintenance;
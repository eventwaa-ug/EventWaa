import { useEffect, useState } from "react";
import "./AdminSettings.css";
import { usePlatformSettings } from "../context/PlatformSettingsContext.jsx";

const API_URL = "http://127.0.0.1:5000";
const DEFAULT_SETTINGS = {
  platformName: "EventWaa",
  platformLogo: "",

  maintenanceMode: false,
  allowRegistration: true,
  emailVerification: false,

  hostVerification: true,
  communityHosts: false,
  autoApproveHosts: false,

  commission: 10,

  newHostPayout: 2,
  verifiedHostPayout: 1,
  trustedHostPayout: 0,

  currency: "UGX",

  hostRefunds: true,
  autoRefundApproval: false,
  refundWindow: 7,

  bookingNotifications: true,
  emailNotifications: true,

  twoFactor: false,
};

function AdminSettings() {
  const { refreshSettings } = usePlatformSettings();
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(`${API_URL}/admin/settings`);

      if (!response.ok) {
        throw new Error("Failed to load settings");
      }

      const data = await response.json();
       
      setSettings({
        ...DEFAULT_SETTINGS,
        ...(data || {}),
      });
    } catch (error) {
      console.error("SETTINGS LOAD ERROR:", error);
      setError("Unable to load settings from the server.");
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = (name) => {
    setSettings((previous) => ({
      ...previous,
      [name]: !Boolean(previous[name]),
    }));
  };

  const handleChange = (event) => {
    const { name, value, type } = event.target;

    setSettings((previous) => ({
      ...previous,
      [name]:
        type === "number"
          ? value === ""
            ? ""
            : Number(value)
          : value,
    }));
  };

  const uploadLogo = async (file) => {
  try {
    const formData = new FormData();
    formData.append("logo", file);

    const response = await fetch(
      `${API_URL}/admin/upload-logo`,
      {
        method: "POST",
        body: formData,
      }
    );

    const result = await response.json();

    if (result.success) {
      setSettings((prev) => ({
        ...prev,
        platformLogo: result.logo,
      }));

      await refreshSettings();
    }
  } catch (error) {
    console.error("Logo upload failed", error);
  }
};

  const saveSettings = async () => {
    try {
      setSaving(true);
      setError("");

      const cleanedSettings = {
        ...DEFAULT_SETTINGS,
        ...settings,

        commission: Number(settings.commission) || 0,

        newHostPayout: Number(settings.newHostPayout) || 0,
        verifiedHostPayout: Number(settings.verifiedHostPayout) || 0,
        trustedHostPayout: Number(settings.trustedHostPayout) || 0,

        refundWindow: Number(settings.refundWindow) || 0,

        maintenanceMode: Boolean(settings.maintenanceMode),
        allowRegistration: Boolean(settings.allowRegistration),
        emailVerification: Boolean(settings.emailVerification),

        hostVerification: Boolean(settings.hostVerification),
        communityHosts: Boolean(settings.communityHosts),
        autoApproveHosts: Boolean(settings.autoApproveHosts),

        hostRefunds: Boolean(settings.hostRefunds),
        autoRefundApproval: Boolean(settings.autoRefundApproval),

        bookingNotifications: Boolean(settings.bookingNotifications),
        emailNotifications: Boolean(settings.emailNotifications),
        twoFactor: Boolean(settings.twoFactor),
      };

      const response = await fetch(`${API_URL}/admin/settings`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(cleanedSettings),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message || "Failed to save settings."
        );
      }

      setSettings({
        ...DEFAULT_SETTINGS,
        ...(result.settings || cleanedSettings),
      });

      // Refresh the platform settings context after saving
      await refreshSettings();

      alert("Settings saved successfully!");
    } catch (error) {
      console.error("SETTINGS SAVE ERROR:", error);

      setError(
        error.message || "Unable to connect to the server."
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="admin-settings">
        <div className="settings-header">
          <h1>⚙️ Admin Settings</h1>
          <p>Loading platform settings...</p>
        </div>
      </div>
    );
  }
 

  return (
    <div className="admin-settings">
      <div className="settings-header">
        <h1>⚙️ Admin Settings</h1>
        <p>Control how EventWaa operates.</p>
      </div>

      {error && (
        <div className="settings-error">
          {error}
        </div>
      )}

      <div className="settings-grid">

        {/* PLATFORM */}
        {/* PLATFORM */}
    <div className="settings-card">
    <h2>🏢 Platform Settings</h2>

    <label>Platform Name</label>
    <input
        type="text"
        name="platformName"
        value={settings.platformName || ""}
        onChange={handleChange}
    />

    <label>Platform Logo</label>
    <input
        type="file"
        accept="image/*"
        onChange={(e) => {
        if (e.target.files[0]) {
            uploadLogo(e.target.files[0]);
        }
        }}
    />

    {settings.platformLogo && (
        <div className="logo-preview">
        <img
            src={settings.platformLogo}
            alt="Platform Logo"
            className="preview-image"
        />

        <button
            type="button"
            className="remove-logo"
            onClick={async () => {
            try {
                await fetch(
                `${API_URL}/admin/remove-logo`,
                {
                    method: "DELETE",
                }
                );

                setSettings((prev) => ({
                ...prev,
                platformLogo: "",
                }));

                await refreshSettings();
            } catch (error) {
                console.error(
                "Failed to remove logo",
                error
                );
            }
            }}
        >
            Remove Logo
        </button>
        </div>
    )}

    <Toggle
        title="Maintenance Mode"
        value={settings.maintenanceMode}
        action={() =>
        handleToggle("maintenanceMode")
        }
    />
    </div>

        {/* USERS */}
        <div className="settings-card">
          <h2>👥 User Settings</h2>

          <Toggle
            title="Allow New Registrations"
            value={settings.allowRegistration}
            action={() =>
              handleToggle("allowRegistration")
            }
          />

          <Toggle
            title="Email Verification"
            value={settings.emailVerification}
            action={() =>
              handleToggle("emailVerification")
            }
          />
        </div>

        {/* HOSTS */}
        <div className="settings-card">
          <h2>🏠 Host Settings</h2>

          <Toggle
            title="Require Host Verification"
            value={settings.hostVerification}
            action={() =>
              handleToggle("hostVerification")
            }
          />

          <Toggle
            title="Allow Community Hosts"
            value={settings.communityHosts}
            action={() =>
              handleToggle("communityHosts")
            }
          />

          <Toggle
            title="Auto Approve Hosts"
            value={settings.autoApproveHosts}
            action={() =>
              handleToggle("autoApproveHosts")
            }
          />
        </div>

        {/* REVENUE */}
        <div className="settings-card">
          <h2>💰 Revenue & Payout Settings</h2>

          <label>Platform Commission (%)</label>

          <input
            type="number"
            min="0"
            max="100"
            name="commission"
            value={settings.commission ?? 10}
            onChange={handleChange}
          />

          <label>
            New Host Payout Delay (days)
          </label>

          <input
            type="number"
            min="0"
            name="newHostPayout"
            value={settings.newHostPayout ?? 2}
            onChange={handleChange}
          />

          <label>
            Verified Host Payout Delay (days)
          </label>

          <input
            type="number"
            min="0"
            name="verifiedHostPayout"
            value={settings.verifiedHostPayout ?? 1}
            onChange={handleChange}
          />

          <label>
            Trusted Host Payout Delay (days)
          </label>

          <input
            type="number"
            min="0"
            name="trustedHostPayout"
            value={settings.trustedHostPayout ?? 0}
            onChange={handleChange}
          />

          <label>Currency</label>

          <select
            name="currency"
            value={settings.currency || "UGX"}
            onChange={handleChange}
          >
            <option value="UGX">UGX</option>
            <option value="USD">USD</option>
          </select>
        </div>

        {/* REFUNDS */}
        <div className="settings-card">
          <h2>↩️ Refund Settings</h2>

          <Toggle
            title="Allow Hosts to Issue Refunds"
            value={settings.hostRefunds}
            action={() =>
              handleToggle("hostRefunds")
            }
          />

          <Toggle
            title="Automatically Approve Refunds"
            value={settings.autoRefundApproval}
            action={() =>
              handleToggle("autoRefundApproval")
            }
          />

          <label>Refund Window (days)</label>

          <input
            type="number"
            min="0"
            name="refundWindow"
            value={settings.refundWindow ?? 7}
            onChange={handleChange}
          />
        </div>

        {/* NOTIFICATIONS */}
        <div className="settings-card">
          <h2>🔔 Notifications</h2>

          <Toggle
            title="Booking Notifications"
            value={settings.bookingNotifications}
            action={() =>
              handleToggle("bookingNotifications")
            }
          />

          <Toggle
            title="Email Notifications"
            value={settings.emailNotifications}
            action={() =>
              handleToggle("emailNotifications")
            }
          />
        </div>

        {/* SECURITY */}
        <div className="settings-card">
          <h2>🔐 Security</h2>

          <Toggle
            title="Two Factor Authentication"
            value={settings.twoFactor}
            action={() =>
              handleToggle("twoFactor")
            }
          />
        </div>
      </div>

      <button
        className="save-settings"
        onClick={saveSettings}
        disabled={saving}
      >
        {saving ? "Saving..." : "Save Settings"}
      </button>
    </div>
  );
}

function Toggle({ title, value, action }) {
  return (
    <div className="toggle-row">
      <span>{title}</span>

      <button
        type="button"
        className={value ? "toggle active" : "toggle"}
        onClick={action}
        aria-pressed={Boolean(value)}
      >
        <div></div>
      </button>
    </div>
  );
}

export default AdminSettings;
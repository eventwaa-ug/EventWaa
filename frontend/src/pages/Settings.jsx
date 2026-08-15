import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "../styles/Settings.css";

function Settings() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState("account");

  const [notifications, setNotifications] = useState({
    eventReminders: true,
    messages: true,
    pushNotifications: true,
    whatsappAlerts: false,
    marketingEmails: false,
  });

  const [privacy, setPrivacy] = useState({
    profileVisibility: "Public",
    hideTickets: true,
    twoFactor: false,
  });

  // =========================================================
  // NOTIFICATION CHANGE
  // =========================================================

  const handleNotificationChange = (name) => {
    setNotifications((previous) => ({
      ...previous,
      [name]: !previous[name],
    }));
  };

  // =========================================================
  // PRIVACY CHANGE
  // =========================================================

  const handlePrivacyChange = (name) => {
    setPrivacy((previous) => ({
      ...previous,
      [name]: !previous[name],
    }));
  };

  // =========================================================
  // LOGOUT
  // =========================================================

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  // =========================================================
  // TABS
  // =========================================================

  const tabs = [
    {
      id: "account",
      label: "Account",
      icon: "👤",
    },
    {
      id: "host",
      label: "Host",
      icon: "🎤",
    },
    {
      id: "notifications",
      label: "Notifications",
      icon: "🔔",
    },
    {
      id: "privacy",
      label: "Privacy",
      icon: "🔒",
    },
  ];

  return (
    <div className="settings-page">

      {/* =====================================================
          PAGE HEADER
      ===================================================== */}

      <div className="settings-top">

        <button
          type="button"
          className="settings-back-button"
          onClick={() => navigate(-1)}
        >
          ← Back
        </button>

        <div>
          <span className="settings-eyebrow">
            ACCOUNT
          </span>

          <h1>Settings</h1>

          <p>
            Manage your EventWaa account and preferences.
          </p>
        </div>

      </div>


      {/* =====================================================
          PROFILE HEADER
      ===================================================== */}

      <div className="settings-profile">

        <div className="settings-profile-image-wrapper">

          <img
            src={
              user?.profilePhoto ||
              "https://via.placeholder.com/120"
            }
            alt={user?.name || "Profile"}
            className="settings-profile-image"
          />

        </div>

        <div className="settings-profile-info">

          <h2>
            {user?.name || "EventWaa User"}
          </h2>

          <p>
            {user?.email || ""}
          </p>

          <span
            className={
              user?.verifiedHost
                ? "settings-host-badge verified"
                : "settings-host-badge"
            }
          >
            {user?.verifiedHost
              ? "✓ Verified Host"
              : "EventWaa User"}
          </span>

        </div>

      </div>


      {/* =====================================================
          TABS
      ===================================================== */}

      <div className="settings-tabs">

        {tabs.map((tab) => (

          <button
            key={tab.id}
            type="button"
            className={
              activeTab === tab.id
                ? "settings-tab active"
                : "settings-tab"
            }
            onClick={() =>
              setActiveTab(tab.id)
            }
          >

            <span className="settings-tab-icon">
              {tab.icon}
            </span>

            <span>
              {tab.label}
            </span>

          </button>

        ))}

      </div>


      {/* =====================================================
          CONTENT
      ===================================================== */}

      <div className="settings-content">


        {/* ===================================================
            ACCOUNT
        =================================================== */}

        {activeTab === "account" && (

          <div className="settings-card">

            <div className="settings-card-heading">

              <div>
                <span className="settings-section-icon">
                  👤
                </span>
              </div>

              <div>
                <h2>Account Information</h2>

                <p>
                  Your basic EventWaa account information.
                </p>
              </div>

            </div>


            <div className="settings-fields">

              <div className="settings-field">

                <label>
                  Full Name
                </label>

                <input
                  type="text"
                  value={user?.name || ""}
                  readOnly
                />

              </div>


              <div className="settings-field">

                <label>
                  Email Address
                </label>

                <input
                  type="email"
                  value={user?.email || ""}
                  readOnly
                />

              </div>


              <div className="settings-info-box">

                <span>ℹ️</span>

                <p>
                  Your name and email are connected to your
                  EventWaa account. Contact support if you
                  need help changing your account information.
                </p>

              </div>

            </div>

          </div>

        )}


        {/* ===================================================
            HOST
        =================================================== */}

        {activeTab === "host" && (

          <div className="settings-card">

            <div className="settings-card-heading">

              <div>
                <span className="settings-section-icon">
                  🎤
                </span>
              </div>

              <div>
                <h2>Host & Organizer</h2>

                <p>
                  Manage your EventWaa hosting status.
                </p>
              </div>

            </div>


            {user?.verifiedHost ? (

              <div className="host-settings-content">

                <div className="host-status-card verified-host">

                  <div className="host-status-icon">
                    ✓
                  </div>

                  <div className="host-status-info">

                    <strong>
                      Verified Host
                    </strong>

                    <p>
                      Your host account is verified and
                      you can manage your events.
                    </p>

                  </div>

                </div>


                <div className="host-profile-preview">

                  <div className="host-preview-image">

                    <img
                      src={
                        user?.profilePhoto ||
                        "https://via.placeholder.com/120"
                      }
                      alt={
                        user?.name ||
                        "Host profile"
                      }
                    />

                  </div>


                  <div className="host-preview-info">

                    <span>
                      HOST PROFILE
                    </span>

                    <h3>
                      {user?.organizerName ||
                        user?.name ||
                        "Your Host Profile"}
                    </h3>

                    <p>
                      View your public host profile
                      and organizer information.
                    </p>

                  </div>

                </div>


                <button
                  type="button"
                  className="settings-primary-button host-profile-button"
                  onClick={() =>
                    navigate(`/host/${user.id}`)
                  }
                >
                  View My Host Profile
                  <span>→</span>
                </button>

                <button
                  type="button"
                  className="settings-secondary-button"
                  onClick={() =>
                    navigate("/edit-host-profile")
                  }
                >
                  Edit Host Profile
                </button>

              </div>

            ) : user?.hostApplicationStatus === "pending" ? (

              <div className="host-status-card pending-host">

                <div className="host-status-icon">
                  ⏳
                </div>

                <div className="host-status-info">

                  <strong>
                    Application Under Review
                  </strong>

                  <p>
                    Your host application has been submitted
                    and is currently being reviewed.
                  </p>

                </div>

              </div>

            ) : (

              <div className="host-apply-card">

                <div className="host-apply-icon">
                  🎤
                </div>

                <h3>
                  Become an EventWaa Host
                </h3>

                <p>
                  Create events, sell tickets and build
                  your own event audience on EventWaa.
                </p>

                <button
                  type="button"
                  className="settings-primary-button"
                  onClick={() =>
                    navigate("/host-application")
                  }
                >
                  Apply to Become a Host
                  <span>→</span>
                </button>

              </div>

            )}

          </div>

        )}


        {/* ===================================================
            NOTIFICATIONS
        =================================================== */}

        {activeTab === "notifications" && (

          <div className="settings-card">

            <div className="settings-card-heading">

              <div>
                <span className="settings-section-icon">
                  🔔
                </span>
              </div>

              <div>
                <h2>Notifications</h2>

                <p>
                  Choose how EventWaa keeps you informed.
                </p>
              </div>

            </div>


            <div className="settings-options">

              <div className="settings-option">

                <div>
                  <strong>
                    Event reminders
                  </strong>

                  <p>
                    Get reminders about events you are
                    attending.
                  </p>
                </div>

                <input
                  type="checkbox"
                  checked={
                    notifications.eventReminders
                  }
                  onChange={() =>
                    handleNotificationChange(
                      "eventReminders"
                    )
                  }
                />

              </div>


              <div className="settings-option">

                <div>
                  <strong>
                    New messages
                  </strong>

                  <p>
                    Receive notifications when someone
                    sends you a message.
                  </p>
                </div>

                <input
                  type="checkbox"
                  checked={
                    notifications.messages
                  }
                  onChange={() =>
                    handleNotificationChange(
                      "messages"
                    )
                  }
                />

              </div>


              <div className="settings-option">

                <div>
                  <strong>
                    Push notifications
                  </strong>

                  <p>
                    Allow EventWaa to send important
                    notifications.
                  </p>
                </div>

                <input
                  type="checkbox"
                  checked={
                    notifications.pushNotifications
                  }
                  onChange={() =>
                    handleNotificationChange(
                      "pushNotifications"
                    )
                  }
                />

              </div>


              <div className="settings-option">

                <div>
                  <strong>
                    WhatsApp / SMS alerts
                  </strong>

                  <p>
                    Receive important event alerts through
                    WhatsApp or SMS.
                  </p>
                </div>

                <input
                  type="checkbox"
                  checked={
                    notifications.whatsappAlerts
                  }
                  onChange={() =>
                    handleNotificationChange(
                      "whatsappAlerts"
                    )
                  }
                />

              </div>


              <div className="settings-option">

                <div>
                  <strong>
                    Marketing emails
                  </strong>

                  <p>
                    Receive EventWaa news, offers and updates.
                  </p>
                </div>

                <input
                  type="checkbox"
                  checked={
                    notifications.marketingEmails
                  }
                  onChange={() =>
                    handleNotificationChange(
                      "marketingEmails"
                    )
                  }
                />

              </div>

            </div>

          </div>

        )}


        {/* ===================================================
            PRIVACY
        =================================================== */}

        {activeTab === "privacy" && (

          <div className="settings-card">

            <div className="settings-card-heading">

              <div>
                <span className="settings-section-icon">
                  🔒
                </span>
              </div>

              <div>
                <h2>Privacy & Security</h2>

                <p>
                  Control your account privacy and security.
                </p>
              </div>

            </div>


            <div className="settings-field">

              <label>
                Profile Visibility
              </label>

              <select
                value={
                  privacy.profileVisibility
                }
                onChange={(e) =>
                  setPrivacy((previous) => ({
                    ...previous,
                    profileVisibility:
                      e.target.value,
                  }))
                }
              >
                <option value="Public">
                  Public
                </option>

                <option value="Friends Only">
                  Friends Only
                </option>

                <option value="Private">
                  Private
                </option>

              </select>

            </div>


            <div className="settings-option">

              <div>
                <strong>
                  Hide my tickets
                </strong>

                <p>
                  Keep your ticket information private.
                </p>
              </div>

              <input
                type="checkbox"
                checked={
                  privacy.hideTickets
                }
                onChange={() =>
                  handlePrivacyChange(
                    "hideTickets"
                  )
                }
              />

            </div>


            <div className="settings-option">

              <div>
                <strong>
                  Two-factor authentication
                </strong>

                <p>
                  Add another layer of security to your
                  account.
                </p>
              </div>

              <input
                type="checkbox"
                checked={
                  privacy.twoFactor
                }
                onChange={() =>
                  handlePrivacyChange(
                    "twoFactor"
                  )
                }
              />

            </div>


            <div className="security-actions">

              <h3>
                Account Security
              </h3>

              <button
                type="button"
                className="settings-secondary-button"
                onClick={() =>
                  navigate("/forgot-password")
                }
              >
                Change Password
              </button>

            </div>


            <div className="danger-zone">

              <h3>
                Danger Zone
              </h3>

              <p>
                These actions can affect your EventWaa
                account.
              </p>

              <button
                type="button"
                className="delete-account-button"
              >
                Delete Account
              </button>

            </div>

          </div>

        )}

      </div>


      {/* =====================================================
          ACCOUNT ACTIONS
      ===================================================== */}

      <div className="settings-account-actions">

        <button
          type="button"
          onClick={handleLogout}
          className="settings-logout-button"
        >
          🚪 Logout
        </button>

      </div>

    </div>
  );
}

export default Settings;
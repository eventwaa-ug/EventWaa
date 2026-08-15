import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { canCreateEvent } from "../utils/hostAccess";
import "../styles/Profile.css";

function Profile() {
  const navigate = useNavigate();
  const { user, logout, refreshUser } = useAuth();

  const [unreadMessages, setUnreadMessages] = useState(0);

  // ============================================================
  // LOAD UNREAD MESSAGES
  // ============================================================

  useEffect(() => {
    if (!user?.id) return;

    const loadUnreadMessages = async () => {
      try {
        const response = await fetch(
          `http://localhost:5000/messages/unread/${user.id}`
        );

        if (!response.ok) return;

        const data = await response.json();

        setUnreadMessages(data.unread || 0);
      } catch (error) {
        console.log("Unread messages error:", error);
      }
    };

    loadUnreadMessages();

    const interval = setInterval(loadUnreadMessages, 3000);

    return () => clearInterval(interval);
  }, [user?.id]);

  // ============================================================
  // REFRESH USER
  // ============================================================

  useEffect(() => {
    if (user) {
      refreshUser();
    }
  }, [user?.email]);

  // ============================================================
  // LOGOUT
  // ============================================================

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  // ============================================================
  // PROFILE IMAGE
  // ============================================================

  const profileImage =
    user?.profilePhoto ||
    user?.profileImage ||
    user?.photoURL ||
    user?.image ||
    "";

  // ============================================================
  // HOST STATUS
  // ============================================================

  const isVerifiedHost =
    user?.verifiedHost === true ||
    user?.verifiedHost === "true" ||
    user?.role === "host";

  // ============================================================
  // HOST ACTION
  // ============================================================

  const handleHostAction = () => {
    if (isVerifiedHost) {
      navigate("/dashboard");
    } else {
      navigate("/host-application");
    }
  };

  return (
    <div className="profile-page">

      {/* ======================================================
          PROFILE HEADER
      ====================================================== */}

      <section className="profile-card">

        <div className="profile-photo-wrapper">

          {profileImage ? (
            <img
              src={profileImage}
              alt={`${user?.name || "User"} profile`}
              className="profile-photo"
            />
          ) : (
            <div className="profile-photo-fallback">
              {user?.name
                ? user.name.charAt(0).toUpperCase()
                : "U"}
            </div>
          )}

        </div>

        <div className="profile-info">

          <h1>
            {user?.name || "EventWaa User"}
          </h1>

          <p>
            {user?.email || ""}
          </p>

          <div className="profile-status">

            {isVerifiedHost ? (
              <span className="profile-badge verified">
                ✓ Verified Host
              </span>
            ) : (
              <span className="profile-badge">
                EventWaa Member
              </span>
            )}

          </div>

        </div>

      </section>


      {/* ======================================================
          PROFILE MENU
      ====================================================== */}

      <section className="profile-menu">

        {/* MY TICKETS */}

        <button
          className="profile-menu-item"
          onClick={() => navigate("/tickets")}
        >
          <div className="profile-menu-left">

            <span className="profile-menu-icon">
              🎟️
            </span>

            <div>
              <strong>My Tickets</strong>
              <p>View your booked tickets</p>
            </div>

          </div>

          <span className="profile-arrow">
            ›
          </span>
        </button>


        {/* FAVORITES */}

        <button
          className="profile-menu-item"
          onClick={() => navigate("/favorites")}
        >
          <div className="profile-menu-left">

            <span className="profile-menu-icon">
              💚
            </span>

            <div>
              <strong>My Favorites</strong>
              <p>Events you've saved</p>
            </div>

          </div>

          <span className="profile-arrow">
            ›
          </span>
        </button>


        {/* MESSAGES */}

        <button
          className="profile-menu-item"
          onClick={() => navigate("/messages")}
        >
          <div className="profile-menu-left">

            <span className="profile-menu-icon">
              💬
            </span>

            <div>
              <strong>Messages</strong>
              <p>Chat with event hosts</p>
            </div>

          </div>

          <div className="profile-menu-right">

            {unreadMessages > 0 && (
              <span className="notification-count">
                {unreadMessages > 99
                  ? "99+"
                  : unreadMessages}
              </span>
            )}

            <span className="profile-arrow">
              ›
            </span>

          </div>

        </button>


        {/* HOST */}

        <button
          className="profile-menu-item"
          onClick={handleHostAction}
        >
          <div className="profile-menu-left">

            <span className="profile-menu-icon">
              🎤
            </span>

            <div>

              <strong>
                {isVerifiedHost
                  ? "Host Dashboard"
                  : "Become a Host"}
              </strong>

              <p>
                {isVerifiedHost
                  ? "Manage your events"
                  : "Create and manage events"}
              </p>

            </div>

          </div>

          <span className="profile-arrow">
            ›
          </span>

        </button>


        {/* UPCOMING EVENTS */}

        <button
          className="profile-menu-item"
          onClick={() => navigate("/events")}
        >
          <div className="profile-menu-left">

            <span className="profile-menu-icon">
              📅
            </span>

            <div>
              <strong>Upcoming Events</strong>
              <p>Discover events happening soon</p>
            </div>

          </div>

          <span className="profile-arrow">
            ›
          </span>

        </button>


        {/* SETTINGS */}

        <button
          className="profile-menu-item"
          onClick={() => navigate("/settings")}
        >
          <div className="profile-menu-left">

            <span className="profile-menu-icon">
              ⚙️
            </span>

            <div>
              <strong>Settings</strong>
              <p>Manage your account and preferences</p>
            </div>

          </div>

          <span className="profile-arrow">
            ›
          </span>

        </button>

      </section>


      {/* ======================================================
          LOGOUT
      ====================================================== */}

      <section className="profile-logout-section">

        <button
          className="profile-logout-button"
          onClick={handleLogout}
        >
          <span>🚪</span>
          <span>Logout</span>
        </button>

      </section>

    </div>
  );
}

export default Profile;
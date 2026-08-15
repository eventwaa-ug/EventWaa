import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { usePlatformSettings } from "../context/PlatformSettingsContext";
import "./Navbar.css";
function Navbar() {
  const { user, logout } = useAuth();
  const { settings } = usePlatformSettings();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const platformName = settings?.platformName || "EventWaa";
  const platformLogo = settings?.platformLogo || "";
  const closeMenu = () => {
    setMenuOpen(false);
  };
  const handleLogout = () => {
    logout();
    closeMenu();
    navigate("/login");
  };
  return (
    <nav className="navbar">
      {/* LOGO */}
      <Link
        to="/"
        className="navbar-brand"
        onClick={closeMenu}
      >
        {platformLogo ? (
          <img
            src={platformLogo}
            alt={`${platformName} logo`}
            className="navbar-logo"
          />
        ) : (
          <span className="logo-text">
            {platformName}
          </span>
        )}
      </Link>
      {/* MOBILE MENU BUTTON */}
      <button
        className="mobile-menu-button"
        onClick={() => setMenuOpen(!menuOpen)}
        aria-label="Toggle navigation menu"
        aria-expanded={menuOpen}
      >
        <span></span>
        <span></span>
        <span></span>
      </button>
      {/* NAVIGATION */}
      <div
        className={`nav-links ${
          menuOpen ? "nav-links-open" : ""
        }`}
      >
        <Link to="/" onClick={closeMenu}>
          Home
        </Link>
        <Link to="/events" onClick={closeMenu}>
          Events
        </Link>
        {user && (
          <>
            <Link to="/favorites" onClick={closeMenu}>
              Favorites
            </Link>
            <Link to="/tickets" onClick={closeMenu}>
              My Tickets
            </Link>
            <Link to="/messages" onClick={closeMenu}>
              Messages
            </Link>
            <Link to="/notifications" onClick={closeMenu}>
              <span className="notification-icon">
                🔔
              </span>
            </Link>
            <Link to="/profile" onClick={closeMenu}>
              Profile
            </Link>
            <button
              className="logout-button"
              onClick={handleLogout}
            >
              Logout
            </button>
          </>
        )}
        {!user && (
          <>
            <Link to="/login" onClick={closeMenu}>
              Login
            </Link>
            <Link
              to="/register"
              className="register-button"
              onClick={closeMenu}
            >
              Register
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}
export default Navbar;
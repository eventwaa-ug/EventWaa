import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Home,
  CalendarDays,
  Ticket,
  MessageCircle,
  Bell,
  User,
  LogIn,
  UserPlus,
  LogOut,
  Menu,
  X,
  ChevronRight,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { usePlatformSettings } from "../context/PlatformSettingsContext";
import "./Navbar.css";

function Navbar() {
  const { user, logout } = useAuth();
  const { settings } = usePlatformSettings();

  const navigate = useNavigate();

  const [menuOpen, setMenuOpen] = useState(false);

  const platformName =
    settings?.platformName || "EventWaa";

  const platformLogo =
    settings?.platformLogo || "";

  // ============================================================
  // CLOSE MENU
  // ============================================================

  const closeMenu = () => {
    setMenuOpen(false);
  };

  // ============================================================
  // LOGOUT
  // ============================================================

  const handleLogout = () => {
    logout();
    closeMenu();
    navigate("/login");
  };

  // ============================================================
  // TOGGLE MOBILE MENU
  // ============================================================

  const toggleMenu = () => {
    setMenuOpen((current) => !current);
  };

  return (
    <>
      {/* ======================================================
          NAVBAR
      ====================================================== */}

      <nav className="navbar">

        {/* ====================================================
            BRAND
        ==================================================== */}

        <Link
          to="/"
          className="navbar-brand"
          onClick={closeMenu}
        >
          {platformLogo && (
            <img
              src={platformLogo}
              alt={`${platformName} logo`}
              className="navbar-logo"
            />
          )}

          <span className="logo-text">
            {platformName}
          </span>
        </Link>


        {/* ====================================================
            DESKTOP NAVIGATION
        ==================================================== */}

        <div className="desktop-nav-links">

          {/* HOME */}

          <Link
            to="/"
            className="desktop-nav-link"
          >
            <Home
              size={17}
              strokeWidth={2}
            />

            Home
          </Link>


          {/* EVENTS */}

          <Link
            to="/events"
            className="desktop-nav-link"
          >
            <CalendarDays
              size={17}
              strokeWidth={2}
            />

            Events
          </Link>


          {/* AUTHENTICATED USER LINKS */}

          {user && (
            <>

              {/* MY TICKETS */}

              <Link
                to="/tickets"
                className="desktop-nav-link"
              >
                <Ticket
                  size={17}
                  strokeWidth={2}
                />

                My Tickets
              </Link>


              {/* MESSAGES */}

              <Link
                to="/messages"
                className="desktop-nav-link"
              >
                <MessageCircle
                  size={17}
                  strokeWidth={2}
                />

                Messages
              </Link>


              {/* NOTIFICATIONS */}

              <Link
                to="/notifications"
                className="desktop-icon-link"
                aria-label="Notifications"
              >
                <Bell
                  size={20}
                  strokeWidth={2}
                />
              </Link>


              {/* PROFILE */}

              <Link
                to="/profile"
                className="desktop-nav-link"
              >
                <User
                  size={17}
                  strokeWidth={2}
                />

                Profile
              </Link>


              {/* LOGOUT */}

              <button
                type="button"
                className="logout-button"
                onClick={handleLogout}
              >
                <LogOut
                  size={17}
                  strokeWidth={2}
                />

                Logout
              </button>

            </>
          )}


          {/* ==================================================
              GUEST LINKS
          ================================================== */}

          {!user && (
            <>

              <Link
                to="/login"
                className="desktop-login-button"
              >
                Login
              </Link>


              <Link
                to="/register"
                className="desktop-register-button"
              >
                Register
              </Link>

            </>
          )}

        </div>


        {/* ====================================================
            MOBILE MENU BUTTON
        ==================================================== */}

        <button
          type="button"
          className="mobile-menu-button"
          onClick={toggleMenu}
          aria-label={
            menuOpen
              ? "Close navigation menu"
              : "Open navigation menu"
          }
          aria-expanded={menuOpen}
        >
          {menuOpen ? (
            <X
              size={25}
              strokeWidth={2.5}
            />
          ) : (
            <Menu
              size={25}
              strokeWidth={2.5}
            />
          )}
        </button>

      </nav>


      {/* ======================================================
          MOBILE BACKDROP
      ====================================================== */}

      <div
        className={`mobile-menu-backdrop ${
          menuOpen
            ? "mobile-menu-backdrop-open"
            : ""
        }`}
        onClick={closeMenu}
        aria-hidden="true"
      />


      {/* ======================================================
          MOBILE SIDE DRAWER
      ====================================================== */}

      <aside
        className={`mobile-side-menu ${
          menuOpen
            ? "mobile-side-menu-open"
            : ""
        }`}
        aria-hidden={!menuOpen}
      >

        {/* ====================================================
            DRAWER HEADER
        ==================================================== */}

        <div className="mobile-menu-header">

          <Link
            to="/"
            className="mobile-menu-brand"
            onClick={closeMenu}
          >

            {platformLogo && (
              <img
                src={platformLogo}
                alt={`${platformName} logo`}
                className="mobile-menu-logo"
              />
            )}

            <span>
              {platformName}
            </span>

          </Link>


          <button
            type="button"
            className="mobile-close-button"
            onClick={closeMenu}
            aria-label="Close menu"
          >
            <X
              size={22}
              strokeWidth={2}
            />
          </button>

        </div>


        {/* ====================================================
            DRAWER USER AREA
        ==================================================== */}

        {user && (
          <div className="mobile-user-card">

            <div className="mobile-user-avatar">

              <User
                size={20}
                strokeWidth={2}
              />

            </div>


            <div className="mobile-user-info">

              <strong>
                {user.name ||
                  user.firstName ||
                  "Welcome"}
              </strong>

              <span>
                {user.email}
              </span>

            </div>

          </div>
        )}


        {/* ====================================================
            MOBILE NAVIGATION
        ==================================================== */}

        <div className="mobile-nav-links">

          {/* HOME */}

          <Link
            to="/"
            onClick={closeMenu}
          >
            <span className="mobile-nav-icon">
              <Home
                size={19}
                strokeWidth={2}
              />
            </span>

            <span>
              Home
            </span>

            <ChevronRight
              className="mobile-nav-arrow"
              size={17}
            />
          </Link>


          {/* EVENTS */}

          <Link
            to="/events"
            onClick={closeMenu}
          >
            <span className="mobile-nav-icon">
              <CalendarDays
                size={19}
                strokeWidth={2}
              />
            </span>

            <span>
              Events
            </span>

            <ChevronRight
              className="mobile-nav-arrow"
              size={17}
            />
          </Link>


          {/* AUTHENTICATED USER LINKS */}

          {user && (
            <>

              {/* MY TICKETS */}

              <Link
                to="/tickets"
                onClick={closeMenu}
              >
                <span className="mobile-nav-icon">
                  <Ticket
                    size={19}
                    strokeWidth={2}
                  />
                </span>

                <span>
                  My Tickets
                </span>

                <ChevronRight
                  className="mobile-nav-arrow"
                  size={17}
                />
              </Link>


              {/* NOTIFICATIONS */}

              <Link
                to="/notifications"
                onClick={closeMenu}
              >
                <span className="mobile-nav-icon">
                  <Bell
                    size={19}
                    strokeWidth={2}
                  />
                </span>

                <span>
                  Notifications
                </span>

                <ChevronRight
                  className="mobile-nav-arrow"
                  size={17}
                />
              </Link>


              {/* PROFILE */}

              <Link
                to="/profile"
                onClick={closeMenu}
              >
                <span className="mobile-nav-icon">
                  <User
                    size={19}
                    strokeWidth={2}
                  />
                </span>

                <span>
                  Profile
                </span>

                <ChevronRight
                  className="mobile-nav-arrow"
                  size={17}
                />
              </Link>

            </>
          )}


          {/* ==================================================
              GUEST LINKS
          ================================================== */}

          {!user && (
            <>

              {/* LOGIN */}

              <Link
                to="/login"
                onClick={closeMenu}
              >
                <span className="mobile-nav-icon">
                  <LogIn
                    size={19}
                    strokeWidth={2}
                  />
                </span>

                <span>
                  Login
                </span>

                <ChevronRight
                  className="mobile-nav-arrow"
                  size={17}
                />
              </Link>


              {/* CREATE ACCOUNT */}

              <Link
                to="/register"
                className="mobile-register-link"
                onClick={closeMenu}
              >
                <span className="mobile-nav-icon">
                  <UserPlus
                    size={19}
                    strokeWidth={2}
                  />
                </span>

                <span>
                  Create account
                </span>

                <ChevronRight
                  className="mobile-nav-arrow"
                  size={17}
                />
              </Link>

            </>
          )}

        </div>


        {/* ====================================================
            LOGOUT
        ==================================================== */}

        {user && (
          <div className="mobile-menu-footer">

            <button
              type="button"
              className="mobile-logout-button"
              onClick={handleLogout}
            >
              <LogOut
                size={19}
                strokeWidth={2}
              />

              Logout
            </button>

          </div>
        )}

      </aside>
    </>
  );
}

export default Navbar;
import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { usePlatformSettings } from "../context/PlatformSettingsContext.jsx";
import "./HostSidebar.css";
import HostTeamMembers from "../pages/HostTeamMembers.jsx";

function HostSidebar() {
    const navigate = useNavigate();
    const location = useLocation();

    const { user } = useAuth();
    const { settings } = usePlatformSettings();

    const [isOpen, setIsOpen] = useState(false);

    /* ============================================================
       HOST SIDEBAR MENU
    ============================================================ */

    const menuItems = [
        {
            label: "Dashboard",
            icon: "🏠",
            path: "/dashboard",
        },

        {
            label: "My Events",
            icon: "📅",
            path: "/host-events",
        },


        {
            label: "Host Wallet",
            icon: "💰",
            path: "/host-wallet",
        },

        {
            label: "Refunds",
            icon: "↩️",
            path: "/host-refunds",
        },

        {
            label: "Messages",
            icon: "💬",
            path: "/host-messages",
        },

        {
            label: "Team Members",
            icon: "👥",
            path: "/team-members",
        },

        {
            label: "Profile",
            icon: "👤",
            path: "/profile",
        },
    ];

    /* ============================================================
       NAVIGATION
    ============================================================ */

    const handleNavigation = (path) => {
        setIsOpen(false);
        navigate(path);
    };

    /* ============================================================
       LOGOUT
    ============================================================ */

    const handleLogout = () => {
        localStorage.removeItem("user");

        setIsOpen(false);

        navigate("/login");
    };

    /* ============================================================
       PLATFORM BRAND
    ============================================================ */

    const platformName =
        settings?.platformName || "EventWaa";

    const platformLogo =
        settings?.platformLogo || "";

    /* ============================================================
       RENDER
    ============================================================ */

    return (
        <>
            {/* =====================================================
                MOBILE HAMBURGER
            ===================================================== */}

            <button
                className="host-menu-button"
                onClick={() => setIsOpen(true)}
                aria-label="Open host menu"
            >
                <span></span>
                <span></span>
                <span></span>
            </button>

            {/* =====================================================
                OVERLAY
            ===================================================== */}

            {isOpen && (
                <div
                    className="host-sidebar-overlay"
                    onClick={() => setIsOpen(false)}
                />
            )}

            {/* =====================================================
                SIDEBAR
            ===================================================== */}

            <aside
                className={`host-sidebar ${
                    isOpen
                        ? "host-sidebar-open"
                        : ""
                }`}
            >

                {/* =================================================
                    HEADER / PLATFORM BRAND
                ================================================= */}

                <div className="host-sidebar-header">

                    <div
                        className="host-sidebar-logo"
                        onClick={() =>
                            handleNavigation("/dashboard")
                        }
                    >

                        {platformLogo ? (

                            <img
                                src={platformLogo}
                                alt={platformName}
                                className="host-platform-logo"
                            />

                        ) : (

                            <span className="host-logo-text">
                                {platformName}
                            </span>

                        )}

                    </div>

                    {/* =================================================
                        MOBILE CLOSE BUTTON
                    ================================================= */}

                    <button
                        className="host-sidebar-close"
                        onClick={() =>
                            setIsOpen(false)
                        }
                        aria-label="Close host menu"
                    >
                        ×
                    </button>

                </div>

                {/* =================================================
                    HOST ACCOUNT
                ================================================= */}

                <div className="host-profile">

                    <div className="host-avatar">

                        {(user?.name || "H")
                            .charAt(0)
                            .toUpperCase()}

                    </div>

                    <div className="host-profile-info">

                        <strong>
                            {user?.name || "Host"}
                        </strong>

                        <span>
                            Host Account
                        </span>

                    </div>

                </div>

                {/* =================================================
                    NAVIGATION
                ================================================= */}

                <nav className="host-navigation">

                    <p className="host-menu-title">
                        MENU
                    </p>

                    {menuItems.map((item) => {

                        /*
                         * Dashboard and other pages use exact
                         * matching. Team Members also gets its
                         * own active state.
                         */

                        const isActive =
                            location.pathname === item.path ||
                            (
                                item.path === "/team-members" &&
                                location.pathname.startsWith(
                                    "/team-members"
                                )
                            );

                        return (

                            <button
                                key={item.path}
                                className={`host-nav-item ${
                                    isActive
                                        ? "active"
                                        : ""
                                }`}
                                onClick={() =>
                                    handleNavigation(
                                        item.path
                                    )
                                }
                            >

                                <span className="host-nav-icon">
                                    {item.icon}
                                </span>

                                <span>
                                    {item.label}
                                </span>

                            </button>

                        );

                    })}

                </nav>

                {/* =================================================
                    LOGOUT
                ================================================= */}

                <div className="host-sidebar-bottom">

                    <button
                        className="host-nav-item logout-item"
                        onClick={handleLogout}
                    >

                        <span className="host-nav-icon">
                            🚪
                        </span>

                        <span>
                            Logout
                        </span>

                    </button>

                </div>

            </aside>
        </>
    );
}

export default HostSidebar;
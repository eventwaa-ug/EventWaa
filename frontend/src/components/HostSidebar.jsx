import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
    LayoutDashboard,
    CalendarDays,
    WalletCards,
    RotateCcw,
    MessageCircle,
    Users,
    UserRound,
    LogOut,
    Menu,
    X,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { usePlatformSettings } from "../context/PlatformSettingsContext.jsx";
import "./HostSidebar.css";
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
            icon: LayoutDashboard,
            path: "/dashboard",
        },
        {
            label: "My Events",
            icon: CalendarDays,
            path: "/host-events",
        },
        {
            label: "Host Wallet",
            icon: WalletCards,
            path: "/host-wallet",
        },
        {
            label: "Refunds",
            icon: RotateCcw,
            path: "/host-refunds",
        },
        {
            label: "Messages",
            icon: MessageCircle,
            path: "/host-messages",
        },
        {
            label: "Team Members",
            icon: Users,
            path: "/team-members",
        },
        {
            label: "Profile",
            icon: UserRound,
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
                MOBILE MENU BUTTON
            ===================================================== */}
            <button
                type="button"
                className="host-menu-button"
                onClick={() => setIsOpen(true)}
                aria-label="Open host menu"
                aria-expanded={isOpen}
            >
                <Menu size={24} strokeWidth={2.3} />
            </button>
            {/* =====================================================
                MOBILE OVERLAY
            ===================================================== */}
            {isOpen && (
                <div
                    className="host-sidebar-overlay"
                    onClick={() => setIsOpen(false)}
                    aria-hidden="true"
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
                    SIDEBAR HEADER
                ================================================= */}
                <div className="host-sidebar-header">
                    <div
                        className="host-sidebar-logo"
                        onClick={() =>
                            handleNavigation("/dashboard")
                        }
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                            if (
                                e.key === "Enter" ||
                                e.key === " "
                            ) {
                                handleNavigation("/dashboard");
                            }
                        }}
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
                        type="button"
                        className="host-sidebar-close"
                        onClick={() =>
                            setIsOpen(false)
                        }
                        aria-label="Close host menu"
                    >
                        <X size={25} strokeWidth={2.2} />
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
                <nav
                    className="host-navigation"
                    aria-label="Host navigation"
                >
                    <p className="host-menu-title">
                        MENU
                    </p>
                    {menuItems.map((item) => {
                        const Icon = item.icon;
                        /*
                         * Dashboard and normal pages use exact
                         * matching.
                         *
                         * Team Members also stays active for
                         * nested team-member pages.
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
                                type="button"
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
                                    <Icon
                                        size={20}
                                        strokeWidth={2.1}
                                    />
                                </span>
                                <span className="host-nav-label">
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
                        type="button"
                        className="host-nav-item logout-item"
                        onClick={handleLogout}
                    >
                        <span className="host-nav-icon">
                            <LogOut
                                size={20}
                                strokeWidth={2.1}
                            />
                        </span>
                        <span className="host-nav-label">
                            Logout
                        </span>
                    </button>
                </div>
            </aside>
        </>
    );
}
export default HostSidebar;
import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./HostSidebar.css";
function HostSidebar() {
    const navigate = useNavigate();
    const location = useLocation();
    const { user } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
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
            label: "Profile",
            icon: "👤",
            path: "/profile",
        },
    ];
    const handleNavigation = (path) => {
        setIsOpen(false);
        navigate(path);
    };
    const handleLogout = () => {
        localStorage.removeItem("user");
        setIsOpen(false);
        navigate("/login");
    };
    return (
        <>
            {/* =================================================
                MOBILE HAMBURGER
            ================================================= */}
            <button
                className="host-menu-button"
                onClick={() => setIsOpen(true)}
                aria-label="Open host menu"
            >
                <span></span>
                <span></span>
                <span></span>
            </button>
            {/* =================================================
                OVERLAY
            ================================================= */}
            {isOpen && (
                <div
                    className="host-sidebar-overlay"
                    onClick={() => setIsOpen(false)}
                />
            )}
            {/* =================================================
                SIDEBAR
            ================================================= */}
            <aside
                className={`host-sidebar ${
                    isOpen ? "host-sidebar-open" : ""
                }`}
            >
                {/* =================================================
                    HEADER
                ================================================= */}
                <div className="host-sidebar-header">
                    <div
                        className="host-sidebar-logo"
                        onClick={() =>
                            handleNavigation("/dashboard")
                        }
                    >
                        <span className="host-logo-icon">
                            🎟️
                        </span>
                        <span className="host-logo-text">
                            EventWaa
                        </span>
                    </div>
                    <button
                        className="host-sidebar-close"
                        onClick={() => setIsOpen(false)}
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
                        const isActive =
                            location.pathname === item.path;
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
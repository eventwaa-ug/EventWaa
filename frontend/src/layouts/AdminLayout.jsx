import { Outlet, NavLink } from "react-router-dom";
import "./AdminLayout.css";
import { useState } from "react";
import {
    LayoutDashboard,
    Users,
    UserRoundCog,
    CalendarDays,
    ScanLine,
    Mic2,
    Wallet,
    Banknote,
    BarChart3,
    FileText,
    Settings,
    RotateCcw,
    Menu,
    X,
} from "lucide-react";
function AdminLayout() {
    const [openMenu, setOpenMenu] = useState(false);
    const closeMenu = () => {
        setOpenMenu(false);
    };
    return (
        <div className="admin-layout">
            {/* =====================================================
                SIDEBAR
            ===================================================== */}
            <aside
                className={`admin-sidebar ${
                    openMenu ? "active" : ""
                }`}
            >
                <h2>
                    EventWaa
                </h2>
                <p className="admin-title">
                    Admin Panel
                </p>
                <nav>
                    {/* DASHBOARD */}
                    <NavLink
                        to="/admin"
                        end
                        onClick={closeMenu}
                    >
                        <LayoutDashboard size={19} />
                        <span>Dashboard</span>
                    </NavLink>
                    {/* USERS */}
                    <NavLink
                        to="/admin/users"
                        onClick={closeMenu}
                    >
                        <Users size={19} />
                        <span>Users</span>
                    </NavLink>
                    {/* TEAM MEMBERS */}
                    <NavLink
                        to="/admin/team-members"
                        onClick={closeMenu}
                    >
                        <UserRoundCog size={19} />
                        <span>Team Members</span>
                    </NavLink>
                    {/* EVENTS */}
                    <NavLink
                        to="/admin/events"
                        onClick={closeMenu}
                    >
                        <CalendarDays size={19} />
                        <span>Events</span>
                    </NavLink>
                    {/* SCAN */}
                    <NavLink
                        to="/admin/scan"
                        onClick={closeMenu}
                    >
                        <ScanLine size={19} />
                        <span>Scan Tickets</span>
                    </NavLink>
                    {/* HOST APPLICATIONS */}
                    <NavLink
                        to="/admin/host-applications"
                        onClick={closeMenu}
                    >
                        <Mic2 size={19} />
                        <span>Host Applications</span>
                    </NavLink>
                    {/* REVENUE */}
                    <NavLink
                        to="/admin/revenue"
                        onClick={closeMenu}
                    >
                        <BarChart3 size={19} />
                        <span>Revenue</span>
                    </NavLink>
                    {/* REFUNDS */}
                    <NavLink
                        to="/admin/refunds"
                        onClick={closeMenu}
                    >
                        <RotateCcw size={19} />
                        <span>Refunds</span>
                    </NavLink>
                    {/* WALLET */}
                    <NavLink
                        to="/admin/wallet"
                        onClick={closeMenu}
                    >
                        <Wallet size={19} />
                        <span>Wallet</span>
                    </NavLink>
                    {/* WITHDRAWALS */}
                    <NavLink
                        to="/admin/withdrawals"
                        onClick={closeMenu}
                    >
                        <Banknote size={19} />
                        <span>Host Withdrawals</span>
                    </NavLink>
                    {/* REPORTS */}
                    <NavLink
                        to="/admin/reports"
                        onClick={closeMenu}
                    >
                        <FileText size={19} />
                        <span>Reports</span>
                    </NavLink>
                    {/* SETTINGS */}
                    <NavLink
                        to="/admin/settings"
                        onClick={closeMenu}
                    >
                        <Settings size={19} />
                        <span>Settings</span>
                    </NavLink>
                </nav>
            </aside>
            {/* =====================================================
                MAIN CONTENT
            ===================================================== */}
            <main className="admin-content">
                <button
                    type="button"
                    className="menu-btn"
                    onClick={() =>
                        setOpenMenu(!openMenu)
                    }
                    aria-label={
                        openMenu
                            ? "Close menu"
                            : "Open menu"
                    }
                >
                    {openMenu ? (
                        <X size={24} />
                    ) : (
                        <Menu size={24} />
                    )}
                </button>
                {/* =================================================
                    CHILD ROUTES RENDER HERE
                ================================================= */}
                <Outlet />
            </main>
        </div>
    );
}
export default AdminLayout;
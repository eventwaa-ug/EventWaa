import { Outlet, Link } from "react-router-dom";
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
    FileText,
    Settings,
    RotateCcw,
    Menu,
    X,
} from "lucide-react";


function AdminLayout() {

    const [openMenu, setOpenMenu] =
        useState(false);


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

                    <Link
                        to="/admin"
                        onClick={closeMenu}
                    >
                        <LayoutDashboard size={19} />
                        <span>Dashboard</span>
                    </Link>


                    {/* USERS */}

                    <Link
                        to="/admin/users"
                        onClick={closeMenu}
                    >
                        <Users size={19} />
                        <span>Users</span>
                    </Link>


                    {/* TEAM MEMBERS */}

                    <Link
                        to="/admin/team-members"
                        onClick={closeMenu}
                    >
                        <UserRoundCog size={19} />
                        <span>Team Members</span>
                    </Link>


                    {/* EVENTS */}

                    <Link
                        to="/admin/events"
                        onClick={closeMenu}
                    >
                        <CalendarDays size={19} />
                        <span>Events</span>
                    </Link>


                    {/* SCAN */}

                    <Link
                        to="/admin/scan"
                        onClick={closeMenu}
                    >
                        <ScanLine size={19} />
                        <span>Scan Tickets</span>
                    </Link>


                    {/* HOST APPLICATIONS */}

                    <Link
                        to="/admin/host-applications"
                        onClick={closeMenu}
                    >
                        <Mic2 size={19} />
                        <span>Host Applications</span>
                    </Link>


                    {/* REVENUE */}

                    <Link
                        to="/admin/revenue"
                        onClick={closeMenu}
                    >
                        <Banknote size={19} />
                        <span>Revenue</span>
                    </Link>


                    {/* REFUNDS */}

                    <Link
                        to="/admin/refunds"
                        onClick={closeMenu}
                    >
                        <RotateCcw size={19} />
                        <span>Refunds</span>
                    </Link>


                    {/* WALLET */}

                    <Link
                        to="/admin/wallet"
                        onClick={closeMenu}
                    >
                        <Wallet size={19} />
                        <span>Wallet</span>
                    </Link>


                    {/* WITHDRAWALS */}

                    <Link
                        to="/admin/withdrawals"
                        onClick={closeMenu}
                    >
                        <Banknote size={19} />
                        <span>Host Withdrawals</span>
                    </Link>


                    {/* REPORTS */}

                    <Link
                        to="/admin/reports"
                        onClick={closeMenu}
                    >
                        <FileText size={19} />
                        <span>Reports</span>
                    </Link>


                    {/* SETTINGS */}

                    <Link
                        to="/admin/settings"
                        onClick={closeMenu}
                    >
                        <Settings size={19} />
                        <span>Settings</span>
                    </Link>


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
import { useEffect, useState } from "react";
import "./AdminHome.css";
import { useNavigate } from "react-router-dom";
import {
    Users,
    CalendarDays,
    Clock3,
    BadgeCheck,
    Bell,
    Ticket,
    ArrowRight,
    ShieldCheck,
    Wallet,
    UserCheck,
    BarChart3,
    RefreshCcw,
    ScanLine
} from "lucide-react";
function AdminHome() {
    const navigate = useNavigate();
    /* ============================================================
       NOTIFICATIONS
    ============================================================ */
    const [adminNotifications, setAdminNotifications] =
        useState([]);
    /* ============================================================
       DASHBOARD STATS
    ============================================================ */
    const [stats, setStats] = useState({
        users: 0,
        events: 0,
        pendingHosts: 0,
        verifiedHosts: 0,
        ticketsSold: 0
    });
    /* ============================================================
       UNREAD NOTIFICATIONS
    ============================================================ */
    const unreadCount =
        adminNotifications.filter(
            notification =>
                notification.read === false
        ).length;
    /* ============================================================
       LOAD NOTIFICATIONS
    ============================================================ */
    const loadNotifications = () => {
        fetch(
            "http://localhost:5000/admin/notifications"
        )
            .then(res =>
                res.json()
            )
            .then(data => {
                setAdminNotifications(
                    Array.isArray(data)
                        ? data
                        : []
                );
            })
            .catch(err =>
                console.log(err)
            );
    };
    /* ============================================================
       LOAD DASHBOARD
    ============================================================ */
    async function loadDashboard() {
        try {
            /* ====================================================
               USERS
            ==================================================== */
            const usersRes =
                await fetch(
                    "http://localhost:5000/users"
                );
            const usersData =
                await usersRes.json();
            const users =
                Array.isArray(usersData)
                    ? usersData
                    : [];
            /* ====================================================
               EVENTS
            ==================================================== */
            const eventsRes =
                await fetch(
                    "http://localhost:5000/events"
                );
            const eventsData =
                await eventsRes.json();
            const events =
                Array.isArray(eventsData)
                    ? eventsData
                    : [];
            /* ====================================================
               HOST APPLICATIONS
            ==================================================== */
            const hostRes =
                await fetch(
                    "http://localhost:5000/host-applications"
                );
            const applicationsData =
                await hostRes.json();
            const applications =
                Array.isArray(
                    applicationsData
                )
                    ? applicationsData
                    : [];
            /* ====================================================
               TOTAL TICKETS SOLD
               
               Uses the existing ticketsSold field
               from every event.
               
               Example:
               
               Event A = 50
               Event B = 30
               Event C = 20
               
               Platform total = 100
               ==================================================== */
            const totalTicketsSold =
                events.reduce(
                    (
                        total,
                        event
                    ) => {
                        const sold =
                            Number(
                                event?.ticketsSold
                            );
                        if (
                            Number.isFinite(
                                sold
                            )
                        ) {
                            return (
                                total +
                                Math.max(
                                    sold,
                                    0
                                )
                            );
                        }
                        return total;
                    },
                    0
                );
            /* ====================================================
               UPDATE DASHBOARD STATS
            ==================================================== */
            setStats({
                users:
                    users.length,
                events:
                    events.length,
                pendingHosts:
                    applications.filter(
                        app =>
                            app.status ===
                            "pending"
                    ).length,
                verifiedHosts:
                    users.filter(
                        user =>
                            user.verifiedHost
                    ).length,
                ticketsSold:
                    totalTicketsSold
            });
        } catch (error) {
            console.log(
                "ADMIN DASHBOARD LOAD ERROR:",
                error
            );
        }
    }
    /* ============================================================
       LOAD DATA
    ============================================================ */
    useEffect(() => {
        loadNotifications();
        loadDashboard();
    }, []);
    /* ============================================================
       RENDER
    ============================================================ */
    return (
        <div className="admin-home">
            {/* ====================================================
                HEADER
            ==================================================== */}
            <div className="admin-home-header">
                <div>
                    <p className="admin-eyebrow">
                        EVENTWAA ADMINISTRATION
                    </p>
                    <h1>
                        Admin Dashboard
                    </h1>
                    <p className="admin-subtitle">
                        Manage your platform, events,
                        hosts, users and operations.
                    </p>
                </div>
                <button
                    type="button"
                    className="admin-notification-button"
                    onClick={() =>
                        navigate(
                            "/admin/notifications"
                        )
                    }
                >
                    <Bell size={21} />
                    <span>
                        Notifications
                    </span>
                    {unreadCount > 0 && (
                        <span className="notification-badge">
                            {unreadCount}
                        </span>
                    )}
                </button>
            </div>
            {/* ====================================================
                OVERVIEW
            ==================================================== */}
            <div className="admin-section-heading">
                <div>
                    <h2>
                        Platform Overview
                    </h2>
                    <p>
                        Current activity across EventWaa.
                    </p>
                </div>
                <button
                    type="button"
                    className="refresh-dashboard"
                    onClick={() => {
                        loadDashboard();
                        loadNotifications();
                    }}
                >
                    <RefreshCcw size={17} />
                    Refresh
                </button>
            </div>
            {/* ====================================================
                DASHBOARD STATS
            ==================================================== */}
            <div className="dashboard-cards">
                {/* =================================================
                    USERS
                ================================================= */}
                <div className="dashboard-card">
                    <div className="dashboard-card-top">
                        <div className="dashboard-card-icon users-icon">
                            <Users size={23} />
                        </div>
                        <span className="dashboard-card-label">
                            USERS
                        </span>
                    </div>
                    <h3>
                        {stats.users}
                    </h3>
                    <p>
                        Registered users
                    </p>
                </div>
                {/* =================================================
                    EVENTS
                ================================================= */}
                <div className="dashboard-card">
                    <div className="dashboard-card-top">
                        <div className="dashboard-card-icon events-icon">
                            <CalendarDays size={23} />
                        </div>
                        <span className="dashboard-card-label">
                            EVENTS
                        </span>
                    </div>
                    <h3>
                        {stats.events}
                    </h3>
                    <p>
                        Events on platform
                    </p>
                </div>
                {/* =================================================
                    TICKETS SOLD
                ================================================= */}
                <div className="dashboard-card">
                    <div className="dashboard-card-top">
                        <div className="dashboard-card-icon tickets-icon">
                            <Ticket size={23} />
                        </div>
                        <span className="dashboard-card-label">
                            TICKETS SOLD
                        </span>
                    </div>
                    <h3>
                        {stats.ticketsSold}
                    </h3>
                    <p>
                        Tickets sold across platform
                    </p>
                </div>
                {/* =================================================
                    PENDING HOSTS
                ================================================= */}
                <div className="dashboard-card">
                    <div className="dashboard-card-top">
                        <div className="dashboard-card-icon pending-icon">
                            <Clock3 size={23} />
                        </div>
                        <span className="dashboard-card-label">
                            PENDING HOSTS
                        </span>
                    </div>
                    <h3>
                        {stats.pendingHosts}
                    </h3>
                    <p>
                        Awaiting verification
                    </p>
                </div>
                {/* =================================================
                    VERIFIED HOSTS
                ================================================= */}
                <div className="dashboard-card">
                    <div className="dashboard-card-top">
                        <div className="dashboard-card-icon verified-icon">
                            <BadgeCheck size={23} />
                        </div>
                        <span className="dashboard-card-label">
                            VERIFIED HOSTS
                        </span>
                    </div>
                    <h3>
                        {stats.verifiedHosts}
                    </h3>
                    <p>
                        Verified organizers
                    </p>
                </div>
            </div>
            {/* ====================================================
                ADMIN TOOLS
            ==================================================== */}
            <div className="admin-section-heading tools-heading">
                <div>
                    <h2>
                        Administration
                    </h2>
                    <p>
                        Quick access to important platform controls.
                    </p>
                </div>
            </div>
            <div className="admin-tools">
                {/* ==================================================
                    TICKET MANAGEMENT
                ================================================== */}
                <button
                    type="button"
                    className="admin-tool-card"
                    onClick={() =>
                        navigate(
                            "/admin/ticket-lookup"
                        )
                    }
                >
                    <div className="admin-tool-icon">
                        <Ticket size={26} />
                    </div>
                    <div className="admin-tool-content">
                        <h3>
                            Ticket Management
                        </h3>
                        <p>
                            Search tickets, verify ticket
                            information and manage ticket activity.
                        </p>
                    </div>
                    <ArrowRight
                        size={21}
                        className="admin-tool-arrow"
                    />
                </button>
                {/* ==================================================
                    SCAN TICKETS
                ================================================== */}
                <button
                    type="button"
                    className="admin-tool-card"
                    onClick={() =>
                        navigate(
                            "/admin/scan"
                        )
                    }
                >
                    <div className="admin-tool-icon">
                        <ScanLine size={26} />
                    </div>
                    <div className="admin-tool-content">
                        <h3>
                            Ticket Scanner
                        </h3>
                        <p>
                            Scan EventWaa tickets and
                            manage guest entry.
                        </p>
                    </div>
                    <ArrowRight
                        size={21}
                        className="admin-tool-arrow"
                    />
                </button>
                {/* ==================================================
                    USERS
                ================================================== */}
                <button
                    type="button"
                    className="admin-tool-card"
                    onClick={() =>
                        navigate(
                            "/admin/users"
                        )
                    }
                >
                    <div className="admin-tool-icon">
                        <UserCheck size={26} />
                    </div>
                    <div className="admin-tool-content">
                        <h3>
                            User Management
                        </h3>
                        <p>
                            View registered users and
                            manage platform accounts.
                        </p>
                    </div>
                    <ArrowRight
                        size={21}
                        className="admin-tool-arrow"
                    />
                </button>
                {/* ==================================================
                    EVENTS
                ================================================== */}
                <button
                    type="button"
                    className="admin-tool-card"
                    onClick={() =>
                        navigate(
                            "/admin/events"
                        )
                    }
                >
                    <div className="admin-tool-icon">
                        <CalendarDays size={26} />
                    </div>
                    <div className="admin-tool-content">
                        <h3>
                            Event Management
                        </h3>
                        <p>
                            Review, approve and manage
                            events published on EventWaa.
                        </p>
                    </div>
                    <ArrowRight
                        size={21}
                        className="admin-tool-arrow"
                    />
                </button>
                {/* ==================================================
                    HOST APPLICATIONS
                ================================================== */}
                <button
                    type="button"
                    className="admin-tool-card"
                    onClick={() =>
                        navigate(
                            "/admin/host-applications"
                        )
                    }
                >
                    <div className="admin-tool-icon">
                        <ShieldCheck size={26} />
                    </div>
                    <div className="admin-tool-content">
                        <h3>
                            Host Verification
                        </h3>
                        <p>
                            Review applications and
                            verify EventWaa hosts.
                        </p>
                    </div>
                    <ArrowRight
                        size={21}
                        className="admin-tool-arrow"
                    />
                </button>
                {/* ==================================================
                    REVENUE
                ================================================== */}
                <button
                    type="button"
                    className="admin-tool-card"
                    onClick={() =>
                        navigate(
                            "/admin/revenue"
                        )
                    }
                >
                    <div className="admin-tool-icon">
                        <BarChart3 size={26} />
                    </div>
                    <div className="admin-tool-content">
                        <h3>
                            Revenue & Reports
                        </h3>
                        <p>
                            Monitor platform revenue,
                            commissions and financial activity.
                        </p>
                    </div>
                    <ArrowRight
                        size={21}
                        className="admin-tool-arrow"
                    />
                </button>
                {/* ==================================================
                    WALLET
                ================================================== */}
                <button
                    type="button"
                    className="admin-tool-card"
                    onClick={() =>
                        navigate(
                            "/admin/wallet"
                        )
                    }
                >
                    <div className="admin-tool-icon">
                        <Wallet size={26} />
                    </div>
                    <div className="admin-tool-content">
                        <h3>
                            Platform Wallet
                        </h3>
                        <p>
                            Monitor EventWaa wallet
                            balances and transactions.
                        </p>
                    </div>
                    <ArrowRight
                        size={21}
                        className="admin-tool-arrow"
                    />
                </button>
            </div>
        </div>
    );
}
export default AdminHome;
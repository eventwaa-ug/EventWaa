import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    FiActivity,
    FiCalendar,
    FiCheckCircle,
    FiClock,
    FiDollarSign,
    FiSettings,
    FiShield,
    FiUsers,
} from "react-icons/fi";
import { useAuth } from "../context/AuthContext";
import "./AdminHome.css";

const API_URL = import.meta.env.VITE_API_BASE_URL;

const AdminHome = () => {
    const navigate = useNavigate();
    const { admin } = useAuth();

    const [stats, setStats] = useState({
        users: 0,
        events: 0,
        bookings: 0,
        revenue: 0,
        pendingHosts: 0,
        notifications: 0,
    });

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const loadDashboardData = async () => {
            try {
                setLoading(true);
                setError("");

                const adminToken = localStorage.getItem("eventwaa_admin_token");

                const headers = {
                    "Content-Type": "application/json",
                    ...(adminToken
                        ? { Authorization: `Bearer ${adminToken}` }
                        : {}),
                };

                const [
                    notificationsResponse,
                    usersResponse,
                    eventsResponse,
                    hostsResponse,
                ] = await Promise.all([
                    fetch(`${API_URL}/admin/notifications`, {
                        headers,
                    }),
                    fetch(`${API_URL}/users`, {
                        headers,
                    }),
                    fetch(`${API_URL}/events`, {
                        headers,
                    }),
                    fetch(`${API_URL}/host-applications`, {
                        headers,
                    }),
                ]);

                let users = [];
                let events = [];
                let hostApplications = [];
                let notifications = [];

                if (usersResponse.ok) {
                    const usersData = await usersResponse.json();
                    users = Array.isArray(usersData)
                        ? usersData
                        : usersData.users || [];
                }

                if (eventsResponse.ok) {
                    const eventsData = await eventsResponse.json();
                    events = Array.isArray(eventsData)
                        ? eventsData
                        : eventsData.events || [];
                }

                if (hostsResponse.ok) {
                    const hostsData = await hostsResponse.json();
                    hostApplications = Array.isArray(hostsData)
                        ? hostsData
                        : hostsData.applications || [];
                }

                if (notificationsResponse.ok) {
                    const notificationsData =
                        await notificationsResponse.json();

                    notifications = Array.isArray(notificationsData)
                        ? notificationsData
                        : notificationsData.notifications || [];
                }

                const bookings = events.reduce((total, event) => {
                    return (
                        total +
                        Number(
                            event.bookingsCount ||
                                event.bookings ||
                                event.ticketsSold ||
                                0
                        )
                    );
                }, 0);

                const revenue = events.reduce((total, event) => {
                    return (
                        total +
                        Number(
                            event.revenue ||
                                event.totalRevenue ||
                                event.sales ||
                                0
                        )
                    );
                }, 0);

                const pendingHosts = hostApplications.filter(
                    (application) =>
                        String(application.status || "").toLowerCase() ===
                        "pending"
                ).length;

                setStats({
                    users: users.length,
                    events: events.length,
                    bookings,
                    revenue,
                    pendingHosts,
                    notifications: notifications.length,
                });
            } catch (err) {
                console.error("Failed to load admin dashboard:", err);
                setError("Unable to load dashboard data.");
            } finally {
                setLoading(false);
            }
        };

        loadDashboardData();
    }, []);

    const dashboardCards = [
        {
            title: "Total Users",
            value: stats.users,
            icon: <FiUsers />,
            action: () => navigate("/admin/users"),
        },
        {
            title: "Total Events",
            value: stats.events,
            icon: <FiCalendar />,
            action: () => navigate("/admin/events"),
        },
        {
            title: "Bookings",
            value: stats.bookings,
            icon: <FiCheckCircle />,
            action: () => navigate("/admin/bookings"),
        },
        {
            title: "Revenue",
            value: `UGX ${Number(stats.revenue || 0).toLocaleString()}`,
            icon: <FiDollarSign />,
            action: () => navigate("/admin/payments"),
        },
        {
            title: "Pending Hosts",
            value: stats.pendingHosts,
            icon: <FiClock />,
            action: () => navigate("/admin/host-applications"),
        },
        {
            title: "Notifications",
            value: stats.notifications,
            icon: <FiActivity />,
            action: () => navigate("/admin/notifications"),
        },
    ];

    return (
        <div className="admin-home">
            <div className="admin-home-header">
                <div>
                    <h1>Admin Dashboard</h1>
                    <p>
                        Welcome back
                        {admin?.name ? `, ${admin.name}` : ""}. Here's what's
                        happening on EventWaa.
                    </p>
                </div>

                <button
                    type="button"
                    className="admin-settings-button"
                    onClick={() => navigate("/admin/settings")}
                >
                    <FiSettings />
                    Settings
                </button>
            </div>

            {error && <div className="admin-home-error">{error}</div>}

            {loading ? (
                <div className="admin-home-loading">
                    Loading dashboard...
                </div>
            ) : (
                <>
                    <div className="admin-dashboard-grid">
                        {dashboardCards.map((card) => (
                            <button
                                key={card.title}
                                type="button"
                                className="admin-dashboard-card"
                                onClick={card.action}
                            >
                                <div className="admin-dashboard-card-icon">
                                    {card.icon}
                                </div>

                                <div className="admin-dashboard-card-content">
                                    <span>{card.title}</span>
                                    <strong>{card.value}</strong>
                                </div>
                            </button>
                        ))}
                    </div>

                    <div className="admin-quick-actions">
                        <div className="admin-section-header">
                            <div>
                                <h2>Quick Actions</h2>
                                <p>Manage the main areas of EventWaa.</p>
                            </div>
                        </div>

                        <div className="admin-quick-actions-grid">
                            <button
                                type="button"
                                onClick={() => navigate("/admin/events")}
                            >
                                <FiCalendar />
                                <span>Manage Events</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => navigate("/admin/users")}
                            >
                                <FiUsers />
                                <span>Manage Users</span>
                            </button>

                            <button
                                type="button"
                                onClick={() =>
                                    navigate("/admin/host-applications")
                                }
                            >
                                <FiShield />
                                <span>Host Applications</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => navigate("/admin/settings")}
                            >
                                <FiSettings />
                                <span>Platform Settings</span>
                            </button>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default AdminHome;
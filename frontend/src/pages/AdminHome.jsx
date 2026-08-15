import { useEffect, useState } from "react";
import "./AdminHome.css";
import { useNavigate} from "react-router-dom";

function AdminHome() {

    const navigate = useNavigate();
    const [adminNotifications, setAdminNotifications] = useState([]);
    const [stats, setStats] = useState({
        users: 0,
        events: 0,
        pendingHosts: 0,
        verifiedHosts: 0
    });

    const unreadCount = adminNotifications.filter(
    notification => notification.read === false
    ).length;

    const loadNotifications = () => {

    fetch("http://localhost:5000/admin/notifications")
    .then(res => res.json())
    .then(data => {
        setAdminNotifications(data);
    })
    .catch(err => console.log(err));

};


useEffect(() => {

    loadNotifications();

}, []);

    useEffect(() => {

        loadDashboard();

    }, []);

    async function loadDashboard() {

        try {

            const usersRes = await fetch("http://localhost:5000/users");
            const users = await usersRes.json();

            const eventsRes = await fetch("http://localhost:5000/events");
            const events = await eventsRes.json();

            const hostRes = await fetch("http://localhost:5000/host-applications");
            const applications = await hostRes.json();

            setStats({

                users: users.length,

                events: events.length,

                pendingHosts: applications.filter(
                    app => app.status === "pending"
                ).length,

                verifiedHosts: users.filter(
                    user => user.verifiedHost
                ).length

            });

        } catch (error) {

            console.log(error);

        }

    }

    return (

        <div className="admin-home">

            <h1>
                EventWaa Admin Dashboard
            </h1>


            <div
                className="admin-notification"
                onClick={() => navigate("/admin/notifications")}
            >
                🔔 Notifications
                {unreadCount > 0 && <span>{unreadCount}</span>}
            </div>

            <div className="notification-list">

                {
                    adminNotifications.map((notification) => (

                        <div
                            key={notification.id}
                            className="notification-item"
                        >

                        </div>

                    ))
                }

            </div>

            <div className="dashboard-cards">

                <div className="dashboard-card">
                    <h2>👥 Users</h2>
                    <h1>{stats.users}</h1>
                </div>

                <div className="dashboard-card">
                    <h2>🎉 Events</h2>
                    <h1>{stats.events}</h1>
                </div>

                <div className="dashboard-card">
                    <h2>⏳ Pending Hosts</h2>
                    <h1>{stats.pendingHosts}</h1>
                </div>

                <div className="dashboard-card">
                    <h2>✅ Verified Hosts</h2>
                    <h1>{stats.verifiedHosts}</h1>
                </div>

                <button
                onClick={() => navigate("withdrawals")}
                >
                💰 Host Withdrawals
                </button>

            </div>

        </div>

    );

}

export default AdminHome;
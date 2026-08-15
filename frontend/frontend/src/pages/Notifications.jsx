import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import "../styles/Notifications.css";

function Notifications() {

    const { user } = useAuth();

    const navigate = useNavigate();

    const [notifications, setNotifications] = useState([]);

    const loadNotifications = async () => {

        if (!user) return;

        const response = await fetch(
            `http://localhost:5000/notifications/${user.id}`
        );

        const data = await response.json();

        setNotifications(data);
    };

    useEffect(() => {

        loadNotifications();

        const interval = setInterval(loadNotifications, 3000);

        return () => clearInterval(interval);

    }, [user]);

    const openNotification = async (notification) => {

        await fetch(
            `http://localhost:5000/notifications/read/${notification.id}`,
            {
                method: "PUT"
            }
        );

        navigate(notification.link);

    };

    return (

        <div className="notifications-page">

            <h1>🔔 Notifications</h1>

            {

                notifications.length === 0 ?

                <p>No notifications yet.</p>

                :

                notifications.map(notification => (

                    <div
                        key={notification.id}
                        className="notification-card"
                        onClick={() => openNotification(notification)}
                    >

                        <div className="notification-header">

                            <h3>{notification.title}</h3>

                            {

                                !notification.read &&

                                <span className="notification-badge">

                                    New

                                </span>

                            }

                        </div>

                        <p>{notification.message}</p>

                        <small>{notification.createdAt}</small>

                    </div>

                ))

            }

        </div>

    );

}

export default Notifications;
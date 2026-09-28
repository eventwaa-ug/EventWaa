import { useEffect, useState } from "react";
import {
FiBell,
FiCheckCircle,
FiChevronRight,
FiInbox,
} from "react-icons/fi";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import "../styles/Notifications.css";

const BACKEND_URL =
import.meta.env.VITE_API_BASE_URL;

function Notifications() {

const { user } = useAuth();
const navigate = useNavigate();
const [notifications, setNotifications] =
    useState([]);
const loadNotifications = async () => {
    if (!user) return;
    try {
        const response = await fetch(
            `${BACKEND_URL}/notifications/${user.id}`
        );
        if (!response.ok) {
            throw new Error(
                "Failed to load notifications."
            );
        }
        const data = await response.json();
        setNotifications(
            Array.isArray(data)
                ? data
                : []
        );
    } catch (error) {
        console.error(
            "NOTIFICATIONS LOAD ERROR:",
            error
        );
    }
};
useEffect(() => {
    loadNotifications();
    const interval = setInterval(
        loadNotifications,
        3000
    );
    return () =>
        clearInterval(interval);
}, [user]);
const openNotification = async (
    notification
) => {
    try {
        await fetch(
            `${BACKEND_URL}/notifications/read/${notification.id}`,
            {
                method: "PUT",
            }
        );
    } catch (error) {
        console.error(
            "NOTIFICATION READ ERROR:",
            error
        );
    }
    if (notification.link) {
        navigate(
            notification.link
        );
    }
};
return (
    <div className="notifications-page">
        {/* ==================================================
            HEADER
        ================================================== */}
        <div className="notifications-header">
            <div className="notifications-title">
                <div className="notifications-title-icon">
                    <FiBell />
                </div>
                <div>
                    <h1>
                        Notifications
                    </h1>
                    <span>
                        {notifications.length}{" "}
                        {notifications.length === 1
                            ? "notification"
                            : "notifications"}
                    </span>
                </div>
            </div>
        </div>
        {/* ==================================================
            EMPTY STATE
        ================================================== */}
        {notifications.length === 0 ? (
            <div className="notifications-empty">
                <div className="notifications-empty-icon">
                    <FiInbox />
                </div>
                <h2>
                    No notifications
                </h2>
                <p>
                    You're all caught up.
                </p>
            </div>
        ) : (
            /* ==================================================
               NOTIFICATION LIST
            ================================================== */
            <div className="notifications-list">
                {notifications.map(
                    (notification) => {
                        const isUnread =
                            !notification.read;
                        return (
                            <button
                                key={notification.id}
                                type="button"
                                className={`notification-card ${
                                    isUnread
                                        ? "unread"
                                        : ""
                                }`}
                                onClick={() =>
                                    openNotification(
                                        notification
                                    )
                                }
                            >
                                <div className="notification-icon">
                                    {isUnread ? (
                                        <FiBell />
                                    ) : (
                                        <FiCheckCircle />
                                    )}
                                </div>
                                <div className="notification-content">
                                    <div className="notification-header">
                                        <h3>
                                            {
                                                notification.title
                                            }
                                        </h3>
                                        {isUnread && (
                                            <span className="notification-badge">
                                                New
                                            </span>
                                        )}
                                    </div>
                                    <p>
                                        {
                                            notification.message
                                        }
                                    </p>
                                    <small>
                                        {
                                            notification.createdAt
                                        }
                                    </small>
                                </div>
                                <FiChevronRight className="notification-arrow" />
                            </button>
                        );
                    }
                )}
            </div>
        )}
    </div>
);

}

export default Notifications;
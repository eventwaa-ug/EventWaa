import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./AdminNotifications.css";
import { Bell } from "lucide-react";
import { adminFetch } from "../utils/adminAPI";

function AdminNotifications() {
    const navigate = useNavigate();

    const [notifications, setNotifications] =
        useState([]);

    const [filter, setFilter] =
        useState("unread");

    const loadNotifications = async () => {
        try {
            const data =
                await adminFetch(
                    "/admin/notifications"
                );

            const loadedNotifications =
                Array.isArray(data)
                    ? data
                    : Array.isArray(
                          data?.notifications
                      )
                    ? data.notifications
                    : [];

            setNotifications(
                loadedNotifications
            );

        } catch (err) {
            console.error(
                "ADMIN NOTIFICATIONS LOAD ERROR:",
                err
            );
        }
    };

    useEffect(() => {
        loadNotifications();
    }, []);

    const markAsRead = async (id) => {
        try {
            await adminFetch(
                `/notifications/read/${id}`,
                {
                    method: "PUT",
                }
            );

            setNotifications(
                (prev) =>
                    prev.map(
                        (notification) =>
                            notification.id === id
                                ? {
                                      ...notification,
                                      read: true,
                                  }
                                : notification
                    )
            );

        } catch (err) {
            console.error(
                "MARK NOTIFICATION READ ERROR:",
                err
            );
        }
    };

    const deleteNotification = async (id) => {
        try {
            await adminFetch(
                `/notifications/${id}`,
                {
                    method: "DELETE",
                }
            );

            setNotifications(
                (prev) =>
                    prev.filter(
                        (notification) =>
                            notification.id !== id
                    )
            );

        } catch (err) {
            console.error(
                "DELETE NOTIFICATION ERROR:",
                err
            );
        }
    };

    const filteredNotifications =
        notifications.filter(
            (notification) => {
                if (filter === "all") {
                    return true;
                }

                if (filter === "unread") {
                    return !notification.read;
                }

                if (filter === "reviewed") {
                    return notification.read;
                }

                return true;
            }
        );

    return (
        <div className="admin-notifications-page">

            <h1
                style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                }}
            >
                <Bell size={26} />
                Admin Notification Centre
            </h1>

            <div className="notification-filters">

                <button
                    className={
                        filter === "unread"
                            ? "active"
                            : ""
                    }
                    onClick={() =>
                        setFilter("unread")
                    }
                >
                    Unread
                </button>

                <button
                    className={
                        filter === "reviewed"
                            ? "active"
                            : ""
                    }
                    onClick={() =>
                        setFilter("reviewed")
                    }
                >
                    Reviewed
                </button>

                <button
                    className={
                        filter === "all"
                            ? "active"
                            : ""
                    }
                    onClick={() =>
                        setFilter("all")
                    }
                >
                    All
                </button>

            </div>

            {filteredNotifications.length === 0 ? (
                <p>
                    No notifications.
                </p>
            ) : (
                filteredNotifications.map(
                    (notification) => (
                        <div
                            key={notification.id}
                            className={`notification-card ${
                                notification.read
                                    ? "read"
                                    : "unread"
                            }`}
                        >

                            <div className="notification-content">

                                <h3>
                                    {
                                        notification.title
                                    }
                                </h3>

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

                            <div className="notification-actions">

                                {!notification.read && (
                                    <button
                                        onClick={() =>
                                            markAsRead(
                                                notification.id
                                            )
                                        }
                                    >
                                        Mark reviewed
                                    </button>
                                )}

                                <button
                                    onClick={() =>
                                        navigate(
                                            notification.link
                                        )
                                    }
                                >
                                    Open
                                </button>

                                <button
                                    className="delete-btn"
                                    onClick={() =>
                                        deleteNotification(
                                            notification.id
                                        )
                                    }
                                >
                                    Delete
                                </button>

                            </div>

                        </div>
                    )
                )
            )}

        </div>
    );
}

export default AdminNotifications;
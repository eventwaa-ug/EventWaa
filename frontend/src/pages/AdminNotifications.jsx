import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./AdminNotifications.css";

function AdminNotifications() {

const navigate = useNavigate();
const [notifications, setNotifications] = useState([]);
const [filter, setFilter] = useState('unread');
const loadNotifications = async () => {
    try {
        const res = await fetch('http://localhost:5000/admin/notifications');
        const data = await res.json();
        setNotifications(data);
    } catch (err) {
        console.log(err);
    }
};
useEffect(() => {
    loadNotifications();
}, []);
const markAsRead = async (id) => {
    try {
        await fetch(`http://localhost:5000/notifications/read/${id}`, {
            method: 'PUT'
        });
        setNotifications(prev =>
            prev.map(notification =>
                notification.id === id
                    ? { ...notification, read: true }
                    : notification
            )
        );
    } catch (err) {
        console.log(err);
    }
};
const deleteNotification = async (id) => {
    try {
        await fetch(`http://localhost:5000/notifications/${id}`, {
            method: 'DELETE'
        });
        setNotifications(prev =>
            prev.filter(notification => notification.id !== id)
        );
    } catch (err) {
        console.log(err);
    }
};
const filteredNotifications = notifications.filter(notification => {
    if (filter === 'all') return true;
    if (filter === 'unread') return !notification.read;
    if (filter === 'reviewed') return notification.read;
    return true;
});
return (
    <div className='admin-notifications-page'>
        <h1>🔔 Admin Notification Center</h1>
        <div className='notification-filters'>
            <button
                className={filter === 'unread' ? 'active' : ''}
                onClick={() => setFilter('unread')}
            >
                Unread
            </button>
            <button
                className={filter === 'reviewed' ? 'active' : ''}
                onClick={() => setFilter('reviewed')}
            >
                Reviewed
            </button>
            <button
                className={filter === 'all' ? 'active' : ''}
                onClick={() => setFilter('all')}
            >
                All
            </button>
        </div>
        {filteredNotifications.length === 0 ? (
            <p>No notifications.</p>
        ) : (
            filteredNotifications.map(notification => (
                <div
                    key={notification.id}
                    className={`notification-card ${notification.read ? 'read' : 'unread'}`}
                >
                    <div className='notification-content'>
                        <h3>{notification.title}</h3>
                        <p>{notification.message}</p>
                        <small>{notification.createdAt}</small>
                    </div>
                    <div className='notification-actions'>
                        {!notification.read && (
                            <button
                                onClick={() => markAsRead(notification.id)}
                            >
                                Mark reviewed
                            </button>
                        )}
                        <button
                            onClick={() => navigate(notification.link)}
                        >
                            Open
                        </button>
                        <button
                            className='delete-btn'
                            onClick={() => deleteNotification(notification.id)}
                        >
                            Delete
                        </button>
                    </div>
                </div>
            ))
        )}
    </div>
);

}

export default AdminNotifications;
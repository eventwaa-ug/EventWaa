import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    FiCalendar,
    FiCheck,
    FiEdit,
    FiSearch,
    FiStar,
    FiTrash2,
    FiXCircle,
} from "react-icons/fi";
import "./AdminEvents.css";
const BACKEND_URL = import.meta.env.VITE_API_BASE_URL;
function AdminEvents() {
    const navigate = useNavigate();
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [search, setSearch] = useState("");
    const [filter, setFilter] = useState("all");
    const [cancellingId, setCancellingId] = useState(null);
    const fetchEvents = async () => {
        try {
            setLoading(true);
            setError("");
            const response = await fetch(
                `${BACKEND_URL}/admin/events`
            );
            const data = await response.json();
            if (!response.ok) {
                throw new Error(
                    data.message || "Failed to load events."
                );
            }
            setEvents(
                Array.isArray(data)
                    ? data
                    : []
            );
        } catch (err) {
            console.error(
                "ADMIN EVENTS LOAD ERROR:",
                err
            );
            setError(
                err.message ||
                "Failed to load events."
            );
        } finally {
            setLoading(false);
        }
    };
    useEffect(() => {
        fetchEvents();
    }, []);
    // ========================================================
    // SORT EVENTS
    // ========================================================
    const sortedEvents = useMemo(() => {
        return [...events].sort((a, b) => {
            const dateA = new Date(
                a.createdAt || 0
            ).getTime();
            const dateB = new Date(
                b.createdAt || 0
            ).getTime();
            if (
                !Number.isNaN(dateA) &&
                !Number.isNaN(dateB) &&
                dateA !== dateB
            ) {
                return dateB - dateA;
            }
            return (
                Number(b.id || 0) -
                Number(a.id || 0)
            );
        });
    }, [events]);
    // ========================================================
    // FILTER EVENTS
    // ========================================================
    const filteredEvents = useMemo(() => {
        const query = search
            .trim()
            .toLowerCase();
        return sortedEvents.filter((event) => {
            const title = String(
                event.title || ""
            ).toLowerCase();
            const venue = String(
                event.venue || ""
            ).toLowerCase();
            const city = String(
                event.city || ""
            ).toLowerCase();
            const hostName = String(
                event.hostName ||
                event.organizerName ||
                ""
            ).toLowerCase();
            const matchesSearch =
                !query ||
                title.includes(query) ||
                venue.includes(query) ||
                city.includes(query) ||
                hostName.includes(query);
            if (!matchesSearch) {
                return false;
            }
            const status = String(
                event.status || ""
            ).toLowerCase();
            const isCancelled =
                status === "cancelled";
            const isFeatured =
                Boolean(event.featured);
            const isFree =
                String(
                    event.eventType || ""
                ).toLowerCase() === "free" ||
                (
                    Array.isArray(event.tickets) &&
                    event.tickets.length > 0 &&
                    event.tickets.every(
                        (ticket) =>
                            Number(
                                ticket.price || 0
                            ) === 0
                    )
                );
            const isPaid = !isFree;
            if (filter === "featured") {
                return isFeatured;
            }
            if (filter === "free") {
                return isFree;
            }
            if (filter === "paid") {
                return isPaid;
            }
            if (filter === "cancelled") {
                return isCancelled;
            }
            if (filter === "active") {
                return !isCancelled;
            }
            return true;
        });
    }, [
        sortedEvents,
        search,
        filter,
    ]);
    // ========================================================
    // EVENT PRICE
    // ========================================================
    const getEventPrice = (event) => {
        if (
            String(
                event.eventType || ""
            ).toLowerCase() === "free"
        ) {
            return "Free";
        }
        if (
            Array.isArray(event.tickets) &&
            event.tickets.length > 0
        ) {
            const prices = event.tickets
                .map((ticket) =>
                    Number(
                        ticket.price || 0
                    )
                )
                .filter(
                    (price) =>
                        price >= 0
                );
            if (prices.length > 0) {
                const minimum = Math.min(
                    ...prices
                );
                if (minimum === 0) {
                    return "Free";
                }
                return `UGX ${minimum.toLocaleString()}`;
            }
        }
        if (
            event.price !== undefined &&
            event.price !== null
        ) {
            const price = Number(
                event.price || 0
            );
            if (price === 0) {
                return "Free";
            }
            return `UGX ${price.toLocaleString()}`;
        }
        return "N/A";
    };
    // ========================================================
    // POSTER
    // ========================================================
    const getPoster = (event) => {
        return (
            event.eventPoster ||
            event.image ||
            event.poster ||
            ""
        );
    };
    // ========================================================
    // FEATURE EVENT
    // ========================================================
    const handleFeature = async (event) => {
        try {
            setError("");
            const response = await fetch(
                `${BACKEND_URL}/admin/events/${event.id}/feature`,
                {
                    method: "PUT",
                    headers: {
                        "Content-Type":
                            "application/json",
                    },
                }
            );
            const data =
                await response.json();
            if (!response.ok) {
                throw new Error(
                    data.message ||
                    "Failed to update featured status."
                );
            }
            setEvents((currentEvents) =>
                currentEvents.map(
                    (currentEvent) =>
                        String(
                            currentEvent.id
                        ) ===
                        String(event.id)
                            ? {
                                  ...currentEvent,
                                  featured:
                                      data.featured ??
                                      !currentEvent.featured,
                              }
                            : currentEvent
                )
            );
        } catch (err) {
            console.error(
                "FEATURE EVENT ERROR:",
                err
            );
            alert(
                err.message ||
                "Failed to update featured status."
            );
        }
    };
    // ========================================================
    // DELETE EVENT
    // ========================================================
    const handleDelete = async (event) => {
        const confirmed = window.confirm(
            `Are you sure you want to delete "${event.title}"?\n\nThis action is different from cancellation.`
        );
        if (!confirmed) {
            return;
        }
        try {
            setError("");
            const response = await fetch(
                `${BACKEND_URL}/events/${event.id}`,
                {
                    method: "DELETE",
                }
            );
            const data =
                await response.json();
            if (!response.ok) {
                throw new Error(
                    data.message ||
                    "Failed to delete event."
                );
            }
            setEvents((currentEvents) =>
                currentEvents.filter(
                    (currentEvent) =>
                        String(
                            currentEvent.id
                        ) !==
                        String(event.id)
                )
            );
        } catch (err) {
            console.error(
                "DELETE EVENT ERROR:",
                err
            );
            alert(
                err.message ||
                "Failed to delete event."
            );
        }
    };
    // ========================================================
    // CANCEL EVENT
    // ========================================================
    const handleCancel = async (event) => {
        const firstConfirmation =
            window.confirm(
                `Cancel "${event.title}"?\n\nThis will cancel the event, invalidate its tickets/passes, and process eligible refunds.`
            );
        if (!firstConfirmation) {
            return;
        }
        const reasonInput =
            window.prompt(
                "Enter the reason for cancelling this event:",
                "Event cancelled by EventWaa administration."
            );
        if (reasonInput === null) {
            return;
        }
        const reason =
            reasonInput.trim();
        if (!reason) {
            alert(
                "A cancellation reason is required."
            );
            return;
        }
        const adminToken =
            localStorage.getItem(
                "eventwaa_admin_token"
            );
        if (!adminToken) {
            alert(
                "Your admin session has expired. Please log in again."
            );
            navigate("/admin/login");
            return;
        }
        try {
            setCancellingId(
                event.id
            );
            setError("");
            const response = await fetch(
                `${BACKEND_URL}/admin/events/${event.id}/cancel`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type":
                            "application/json",
                        Authorization:
                            `Bearer ${adminToken}`,
                    },
                    body: JSON.stringify({
                        cancellationReason:
                            reason,
                    }),
                }
            );
            const data =
                await response.json();
            if (!response.ok) {
                throw new Error(
                    data.message ||
                    data.refundError?.message ||
                    "Failed to cancel event."
                );
            }
            setEvents((currentEvents) =>
                currentEvents.map(
                    (currentEvent) =>
                        String(
                            currentEvent.id
                        ) ===
                        String(event.id)
                            ? {
                                  ...currentEvent,
                                  status:
                                      "cancelled",
                                  cancelled:
                                      true,
                                  cancelledAt:
                                      new Date().toISOString(),
                                  cancelledBy:
                                      "admin",
                                  cancellationReason:
                                      reason,
                              }
                            : currentEvent
                )
            );
            alert(
                `Event cancelled successfully.\n\nPaid refunds processed: ${
                    data.processedRefunds || 0
                }\nFree passes cancelled: ${
                    data.freeBookingsCancelled || 0
                }`
            );
        } catch (err) {
            console.error(
                "CANCEL EVENT ERROR:",
                err
            );
            alert(
                err.message ||
                "Failed to cancel event."
            );
        } finally {
            setCancellingId(null);
        }
    };
    // ========================================================
    // LOADING
    // ========================================================
    if (loading) {
        return (
            <div className="admin-events">
                <div className="admin-events-loading">
                    <div className="admin-events-spinner" />
                    <p>
                        Loading events...
                    </p>
                </div>
            </div>
        );
    }
    // ========================================================
    // PAGE
    // ========================================================
    return (
        <div className="admin-events">
            {/* ==================================================
                HEADER
            ================================================== */}
            <div className="admin-events-header">
                <div>
                    <h1>
                        Events
                    </h1>
                    <p>
                        Manage all EventWaa
                        events.
                    </p>
                </div>
                <button
                    type="button"
                    className="admin-events-create-btn"
                    onClick={() =>
                        navigate(
                            "/admin/events/create"
                        )
                    }
                >
                    + Create Event
                </button>
            </div>
            {/* ==================================================
                ERROR
            ================================================== */}
            {error && (
                <div className="admin-events-error">
                    <FiXCircle />
                    <span>
                        {error}
                    </span>
                </div>
            )}
            {/* ==================================================
                FILTER BAR
            ================================================== */}
            <div className="admin-events-toolbar">
                <div className="admin-events-search">
                    <FiSearch />
                    <input
                        type="text"
                        placeholder="Search events..."
                        value={search}
                        onChange={(e) =>
                            setSearch(
                                e.target.value
                            )
                        }
                    />
                </div>
                <div className="admin-events-filters">
                    <button
                        type="button"
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
                    <button
                        type="button"
                        className={
                            filter === "active"
                                ? "active"
                                : ""
                        }
                        onClick={() =>
                            setFilter("active")
                        }
                    >
                        Active
                    </button>
                    <button
                        type="button"
                        className={
                            filter === "featured"
                                ? "active"
                                : ""
                        }
                        onClick={() =>
                            setFilter("featured")
                        }
                    >
                        Featured
                    </button>
                    <button
                        type="button"
                        className={
                            filter === "free"
                                ? "active"
                                : ""
                        }
                        onClick={() =>
                            setFilter("free")
                        }
                    >
                        Free
                    </button>
                    <button
                        type="button"
                        className={
                            filter === "paid"
                                ? "active"
                                : ""
                        }
                        onClick={() =>
                            setFilter("paid")
                        }
                    >
                        Paid
                    </button>
                    <button
                        type="button"
                        className={
                            filter === "cancelled"
                                ? "active"
                                : ""
                        }
                        onClick={() =>
                            setFilter("cancelled")
                        }
                    >
                        Cancelled
                    </button>
                </div>
            </div>
            {/* ==================================================
                RESULT COUNT
            ================================================== */}
            <div className="admin-events-count">
                {filteredEvents.length}{" "}
                event
                {filteredEvents.length !== 1
                    ? "s"
                    : ""}
            </div>
            {/* ==================================================
                EMPTY STATE
            ================================================== */}
            {filteredEvents.length === 0 ? (
                <div className="admin-events-empty">
                    <FiCalendar />
                    <h3>
                        No events found
                    </h3>
                    <p>
                        {search
                            ? "Try a different search."
                            : "There are no events matching this filter."}
                    </p>
                </div>
            ) : (
                /* =================================================
                   EVENT GRID
                ================================================= */
                <div className="admin-events-grid">
                    {filteredEvents.map(
                        (event) => {
                            const poster =
                                getPoster(
                                    event
                                );
                            const isCancelled =
                                String(
                                    event.status ||
                                    ""
                                ).toLowerCase() ===
                                "cancelled";
                            const isCancelling =
                                String(
                                    cancellingId
                                ) ===
                                String(
                                    event.id
                                );
                            const hostName =
                                event.hostName ||
                                event.organizerName ||
                                "EventWaa";
                            return (
                                <div
                                    className={
                                        `admin-event-card ${
                                            isCancelled
                                                ? "cancelled"
                                                : ""
                                        }`
                                    }
                                    key={
                                        event.id
                                    }
                                >
                                    {/* =================================
                                        POSTER
                                    ================================= */}
                                    <div className="admin-poster-wrapper">
                                        {poster ? (
                                            <img
                                                src={
                                                    poster
                                                }
                                                alt={
                                                    event.title ||
                                                    "Event poster"
                                                }
                                                className="admin-event-poster"
                                            />
                                        ) : (
                                            <div className="admin-event-poster-placeholder">
                                                <FiCalendar />
                                            </div>
                                        )}
                                        {/* EVENT TYPE */}
                                        <div className="event-type-overlay">
                                            {String(
                                                event.eventType ||
                                                ""
                                            ).toLowerCase() ===
                                            "free"
                                                ? "FREE"
                                                : "PAID"}
                                        </div>
                                        {/* FEATURED */}
                                        {event.featured && (
                                            <div className="featured-overlay">
                                                <FiStar />
                                                Featured
                                            </div>
                                        )}
                                        {/* CANCELLED */}
                                        {isCancelled && (
                                            <div className="cancelled-overlay">
                                                CANCELLED
                                            </div>
                                        )}
                                    </div>
                                    {/* =================================
                                        CONTENT
                                    ================================= */}
                                    <div className="admin-event-card-content">
                                        <div className="admin-event-title-row">
                                            <div>
                                                <h2>
                                                    {
                                                        event.title ||
                                                        "Untitled Event"
                                                    }
                                                </h2>
                                                <span className="admin-event-id">
                                                    ID:{" "}
                                                    {
                                                        event.id
                                                    }
                                                </span>
                                            </div>
                                            {event.adminEvent && (
                                                <span className="admin-official-badge">
                                                    EventWaa
                                                </span>
                                            )}
                                        </div>
                                        <div className="admin-event-details">
                                            <div>
                                                <strong>
                                                    Host
                                                </strong>
                                                <span>
                                                    {
                                                        hostName
                                                    }
                                                </span>
                                            </div>
                                            <div>
                                                <strong>
                                                    Venue
                                                </strong>
                                                <span>
                                                    {
                                                        event.venue ||
                                                        "N/A"
                                                    }
                                                </span>
                                            </div>
                                            <div>
                                                <strong>
                                                    City
                                                </strong>
                                                <span>
                                                    {
                                                        event.city ||
                                                        "N/A"
                                                    }
                                                </span>
                                            </div>
                                            <div>
                                                <strong>
                                                    Date
                                                </strong>
                                                <span>
                                                    {
                                                        event.date ||
                                                        "N/A"
                                                    }
                                                </span>
                                            </div>
                                            <div>
                                                <strong>
                                                    Category
                                                </strong>
                                                <span>
                                                    {
                                                        event.category ||
                                                        "N/A"
                                                    }
                                                </span>
                                            </div>
                                            <div>
                                                <strong>
                                                    Price
                                                </strong>
                                                <span>
                                                    {
                                                        getEventPrice(
                                                            event
                                                        )
                                                    }
                                                </span>
                                            </div>
                                            <div>
                                                <strong>
                                                    Tickets
                                                </strong>
                                                <span>
                                                    {Array.isArray(
                                                        event.tickets
                                                    )
                                                        ? event.tickets.reduce(
                                                              (
                                                                  total,
                                                                  ticket
                                                              ) =>
                                                                  total +
                                                                  Number(
                                                                      ticket.quantity ||
                                                                      ticket.capacity ||
                                                                      0
                                                                  ),
                                                              0
                                                          ) || "N/A"
                                                        : "N/A"}
                                                </span>
                                            </div>
                                            <div>
                                                <strong>
                                                    Sold
                                                </strong>
                                                <span>
                                                    {
                                                        event.ticketsSold ??
                                                        0
                                                    }
                                                </span>
                                            </div>
                                        </div>
                                        {/* =================================
                                            ACTIONS
                                        ================================= */}
                                        <div className="admin-event-actions">
                                            <button
                                                type="button"
                                                className="edit-btn"
                                                onClick={() =>
                                                    navigate(
                                                        `/admin/events/edit/${event.id}`
                                                    )
                                                }
                                            >
                                                <FiEdit />
                                                Edit
                                            </button>
                                            <button
                                                type="button"
                                                className={
                                                    event.featured
                                                        ? "feature-btn featured"
                                                        : "feature-btn"
                                                }
                                                onClick={() =>
                                                    handleFeature(
                                                        event
                                                    )
                                                }
                                                disabled={
                                                    isCancelled
                                                }
                                            >
                                                <FiStar />
                                                {event.featured
                                                    ? "Featured"
                                                    : "Feature"}
                                            </button>
                                            {!isCancelled ? (
                                                <button
                                                    type="button"
                                                    className="cancel-btn"
                                                    onClick={() =>
                                                        handleCancel(
                                                            event
                                                        )
                                                    }
                                                    disabled={
                                                        isCancelling
                                                    }
                                                >
                                                    <FiXCircle />
                                                    {isCancelling
                                                        ? "Cancelling..."
                                                        : "Cancel"}
                                                </button>
                                            ) : (
                                                <button
                                                    type="button"
                                                    className="cancelled-btn"
                                                    disabled
                                                >
                                                    <FiCheck />
                                                    Cancelled
                                                </button>
                                            )}
                                            <button
                                                type="button"
                                                className="delete-btn"
                                                onClick={() =>
                                                    handleDelete(
                                                        event
                                                    )
                                                }
                                            >
                                                <FiTrash2 />
                                                Delete
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        }
                    )}
                </div>
            )}
        </div>
    );
}
export default AdminEvents;